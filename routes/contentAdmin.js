const express = require('express');
const router = express.Router();

const SiteSettings = require('../models/SiteSettings');
const PageContent = require('../models/PageContent');
const { PAGE_DEFAULTS } = require('../lib/pageContent');
const { CONTENT_SECTIONS } = require('../lib/contentSections');
const { requireAuth, requireStaff, requireModule } = require('../middleware/auth');
const { uploadImage, wrapUpload, friendlyUploadError, fileUrl } = require('../middleware/upload');
const { unlinkUploaded } = require('../lib/files');
const { getSiteSettings } = require('../lib/settings');
const {
  setContent,
  resetContent,
  isValidKey,
  normalizeText,
  normalizeLink,
  invalidateCache,
  getContentMap,
} = require('../lib/siteContent');

router.use(requireAuth, requireStaff, requireModule('noi-dung'));

// Các slot ảnh đã tồn tại từ trước trong SiteSettings (logo, ảnh hero, ảnh hệ sinh thái...) vẫn
// được trang /admin/cai-dat quản lý. Để không có hai nơi lưu cùng một tấm ảnh, khoá dạng
// "settings.<tên field>" sẽ ghi thẳng vào SiteSettings; khoá khác thì lưu vào SiteContent.
// Danh sách lấy động từ schema nên khi thêm field ảnh mới vào SiteSettings là dùng được ngay.
const SETTINGS_IMAGE_FIELDS = Object.keys(SiteSettings.schema.paths).filter((path) => {
  const type = SiteSettings.schema.paths[path];
  return type.instance === 'String' && (path === 'logo' || /Image$/.test(path));
});

function settingsFieldFor(key) {
  if (!key.startsWith('settings.')) return null;
  const field = key.slice('settings.'.length);
  return SETTINGS_IMAGE_FIELDS.includes(field) ? field : null;
}

// Phần hero của mỗi trang (badge, tiêu đề, phụ đề, nút) đã có sẵn trong PageContent và đang được
// trang /admin/trang/:pageKey quản lý. Khoá dạng "page.<pageKey>.<field>" ghi thẳng vào đó để
// không sinh ra hai nguồn dữ liệu cho cùng một dòng chữ — sửa tại chỗ hay sửa trong form đều
// cho cùng một kết quả.
const PAGE_KEY_PATTERN = /^page\.([a-z0-9-]+)\.([A-Za-z][A-Za-z0-9]*)$/;

function pageFieldFor(key) {
  const match = key.match(PAGE_KEY_PATTERN);
  if (!match) return null;
  const [, pageKey, field] = match;
  const defaults = PAGE_DEFAULTS[pageKey];
  if (!defaults || field === 'label' || !Object.prototype.hasOwnProperty.call(defaults, field)) return null;
  return { pageKey, field };
}

// Ghi một ô: khoá dạng page.* đi vào PageContent (cùng chỗ form hero ghi), còn lại vào SiteContent.
async function saveOneField(key, type, value, userId) {
  const pageField = pageFieldFor(key);
  if (pageField) {
    await PageContent.findOneAndUpdate(
      { pageKey: pageField.pageKey },
      { $set: { [pageField.field]: value } },
      { upsert: true },
    );
    return;
  }
  await setContent(key, type, value, userId);
}

// ---- Form "nội dung theo từng phần" trong trang quản trị ----
// Lưu mọi ô của MỘT phần. Chỉ nhận những khoá đã khai báo trong lib/contentSections.js cho
// đúng trang đó, nên không thể nhồi khoá lạ vào database qua form.
router.post('/luu/:pageKey', async (req, res) => {
  const pageSlug = req.params.pageKey;
  const page = CONTENT_SECTIONS[pageSlug];
  if (!page) return res.status(404).render('404');

  const back = '/admin/trang/' + encodeURIComponent(pageSlug);
  const badLinks = [];
  let saved = 0;

  for (const section of page.sections) {
    for (const field of section.fields) {
      if (field.type === 'image') continue;
      if (!Object.prototype.hasOwnProperty.call(req.body, field.key)) continue;

      if (field.type === 'link') {
        const value = normalizeLink(req.body[field.key]);
        if (value === null) { badLinks.push(field.label); continue; }
        await saveOneField(field.key, 'link', value, req.user._id);
      } else {
        const value = normalizeText(req.body[field.key]);
        if (value === null) continue;
        await saveOneField(field.key, 'text', value, req.user._id);
      }
      saved += 1;
    }
  }

  if (badLinks.length) {
    const msg = 'link không hợp lệ ở ô: ' + badLinks.join(', ')
      + '. Link phải bắt đầu bằng /, #, http://, https://, mailto: hoặc tel:';
    return res.redirect(back + '?loi=' + encodeURIComponent(msg));
  }
  res.redirect(back + (saved ? '?noidung=1' : ''));
});

// Thay ảnh của một ô trong form theo phần. Khoá phải là settings.<field> đã khai báo.
router.post('/anh/:pageKey/:key', wrapUpload(uploadImage.single('image'), async (err, req, res) => {
  const back = '/admin/trang/' + encodeURIComponent(req.params.pageKey);
  if (err) return res.redirect(back + '?loi=' + encodeURIComponent(friendlyUploadError(err)));

  const field = settingsFieldFor(req.params.key);
  if (!field) {
    if (req.file) unlinkUploaded(fileUrl(req.file, 'images'));
    return res.redirect(back + '?loi=' + encodeURIComponent('Ô ảnh không hợp lệ.'));
  }
  if (!req.file) return res.redirect(back + '?loi=' + encodeURIComponent('Vui lòng chọn ảnh.'));

  const settings = await getSiteSettings();
  unlinkUploaded(settings[field]);
  settings[field] = fileUrl(req.file, 'images');
  await settings.save();
  res.redirect(back + '?noidung=1');
}));

router.post('/anh/:pageKey/:key/xoa', async (req, res) => {
  const back = '/admin/trang/' + encodeURIComponent(req.params.pageKey);
  const field = settingsFieldFor(req.params.key);
  if (!field) return res.redirect(back + '?loi=' + encodeURIComponent('Ô ảnh không hợp lệ.'));

  const settings = await getSiteSettings();
  unlinkUploaded(settings[field]);
  settings[field] = null;
  await settings.save();
  res.redirect(back + '?noidung=1');
});

router.post('/text', async (req, res) => {
  const { key } = req.body;
  if (!isValidKey(key)) return res.status(400).json({ error: 'Khoá nội dung không hợp lệ.' });

  const value = normalizeText(req.body.value);
  if (value === null) return res.status(400).json({ error: 'Nội dung không hợp lệ.' });

  const pageField = pageFieldFor(key);
  if (pageField) {
    await PageContent.findOneAndUpdate(
      { pageKey: pageField.pageKey },
      { $set: { [pageField.field]: value } },
      { upsert: true },
    );
    return res.json({ ok: true, key, value });
  }

  await setContent(key, 'text', value, req.user._id);
  res.json({ ok: true, key, value });
});

router.post('/link', async (req, res) => {
  const { key } = req.body;
  if (!isValidKey(key)) return res.status(400).json({ error: 'Khoá nội dung không hợp lệ.' });

  const value = normalizeLink(req.body.value);
  if (value === null) {
    return res.status(400).json({
      error: 'Link phải bắt đầu bằng /, #, http://, https://, mailto: hoặc tel:',
    });
  }

  await setContent(key, 'link', value, req.user._id);
  res.json({ ok: true, key, value });
});

// Khôi phục về nội dung mặc định ghi trong code = xoá bản ghi đè.
router.post('/reset', async (req, res) => {
  const { key } = req.body;
  if (!isValidKey(key)) return res.status(400).json({ error: 'Khoá nội dung không hợp lệ.' });

  const settingsField = settingsFieldFor(key);
  const pageField = pageFieldFor(key);

  if (settingsField) {
    const settings = await getSiteSettings();
    unlinkUploaded(settings[settingsField]);
    settings[settingsField] = null;
    await settings.save();
  } else if (pageField) {
    // Ghi lại đúng giá trị mặc định trong code. Không dùng $unset vì Mongoose áp default của
    // schema ('') khi nạp document, nên field bị xoá sẽ đọc ra chuỗi rỗng chứ không phải
    // undefined — getPageContent() sẽ không điền lại mặc định và chữ sẽ mất hẳn.
    await PageContent.findOneAndUpdate(
      { pageKey: pageField.pageKey },
      { $set: { [pageField.field]: PAGE_DEFAULTS[pageField.pageKey][pageField.field] } },
      { upsert: true },
    );
  } else {
    await resetContent(key);
  }
  res.json({ ok: true, key });
});

router.post('/anh', wrapUpload(uploadImage.single('image'), async (err, req, res) => {
  // Lỗi upload (quá dung lượng, sai định dạng) tới qua tham số err của multer, không phải throw.
  if (err) return res.status(400).json({ error: friendlyUploadError(err) });

  const { key } = req.body;
  if (!isValidKey(key)) {
    if (req.file) unlinkUploaded(fileUrl(req.file, 'images'));
    return res.status(400).json({ error: 'Khoá ảnh không hợp lệ.' });
  }
  if (!req.file) return res.status(400).json({ error: 'Vui lòng chọn ảnh.' });

  const url = fileUrl(req.file, 'images');
  const settingsField = settingsFieldFor(key);

  if (settingsField) {
    const settings = await getSiteSettings();
    unlinkUploaded(settings[settingsField]);
    settings[settingsField] = url;
    await settings.save();
  } else {
    const previous = (await getContentMap()).get(key);
    unlinkUploaded(previous);
    await setContent(key, 'image', url, req.user._id);
  }

  invalidateCache();
  res.json({ ok: true, key, url });
}));

module.exports = router;
