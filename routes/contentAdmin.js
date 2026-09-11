const express = require('express');
const router = express.Router();

const SiteSettings = require('../models/SiteSettings');
const PageContent = require('../models/PageContent');
const { PAGE_DEFAULTS } = require('../lib/pageContent');
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
