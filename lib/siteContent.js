const SiteContent = require('../models/SiteContent');
const { MODULE_ROLES } = require('./roles');

// Cache toàn bộ nội dung trong RAM: mỗi request trang công khai cần hàng chục tới hàng trăm
// khoá, query từng khoá một sẽ giết database. Cache được xoá ngay khi có thao tác lưu
// (invalidateCache) nên người sửa thấy kết quả tức thì; TTL chỉ là lưới an toàn cho trường hợp
// chạy nhiều process (pm2 cluster) mà process khác mới là process ghi.
const CACHE_TTL_MS = 15000;
let cache = null;
let cacheLoadedAt = 0;

// Khoá do code đặt, không phải do người dùng nhập, nên siết chặt để tránh rác vào DB nếu có ai
// gọi API trực tiếp: chỉ chữ/số và . _ -
const KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,140}$/;
const MAX_TEXT_LENGTH = 8000;
const MAX_LINK_LENGTH = 500;
// Chỉ cho phép các scheme vô hại. Chặn javascript:, data:, vbscript:... để một biên tập viên
// (role bien_tap) không thể biến một link thành lỗ XSS cho toàn bộ khách truy cập.
const ALLOWED_LINK_PREFIXES = ['/', '#', 'http://', 'https://', 'mailto:', 'tel:'];

function isValidKey(key) {
  return typeof key === 'string' && KEY_PATTERN.test(key);
}

function normalizeText(value) {
  if (typeof value !== 'string') return null;
  // Chuẩn hoá xuống dòng và bỏ khoảng trắng đầu/cuối — contenteditable của trình duyệt hay
  // để lại \r\n và no-break space (U+00A0) khi người dùng dán từ Word.
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/\u00A0/g, ' ')
    .trim()
    .slice(0, MAX_TEXT_LENGTH);
}

function normalizeLink(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().slice(0, MAX_LINK_LENGTH);
  if (!trimmed) return '#';
  const lowered = trimmed.toLowerCase();
  if (!ALLOWED_LINK_PREFIXES.some((prefix) => lowered.startsWith(prefix))) return null;
  return trimmed;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function getContentMap() {
  const now = Date.now();
  if (cache && now - cacheLoadedAt < CACHE_TTL_MS) return cache;
  const docs = await SiteContent.find().lean();
  cache = new Map(docs.map((doc) => [doc.key, doc.value]));
  cacheLoadedAt = now;
  return cache;
}

function invalidateCache() {
  cache = null;
  cacheLoadedAt = 0;
}

function canEditContent(user) {
  return !!user && (MODULE_ROLES['noi-dung'] || []).includes(user.role);
}

// Ghi/xoá một khoá. Trả về giá trị đang có hiệu lực sau thao tác (null nếu đã xoá).
async function setContent(key, kind, value, userId) {
  if (!isValidKey(key)) throw new Error('Khoá nội dung không hợp lệ.');
  await SiteContent.findOneAndUpdate(
    { key },
    { $set: { kind, value, updatedBy: userId || null } },
    { upsert: true },
  );
  invalidateCache();
  return value;
}

async function resetContent(key) {
  if (!isValidKey(key)) throw new Error('Khoá nội dung không hợp lệ.');
  await SiteContent.deleteOne({ key });
  invalidateCache();
}

// Middleware: nạp nội dung và gắn các hàm trợ giúp vào res.locals cho mọi view.
//
//   txt(key, mặc-định)      -> chuỗi thuần, dùng trong thuộc tính HTML (alt, title, placeholder)
//   ed(key, mặc-định)       -> HTML để in bằng <%- %>; ở chế độ sửa thì bọc thành ô sửa tại chỗ
//   pic(key, mặc-định)      -> URL ảnh
//   picAttr(key)            -> thuộc tính đánh dấu ảnh sửa được (in bằng <%- %>)
//   lnk(key, mặc-định)      -> URL đích của link
//   lnkAttr(key)            -> thuộc tính đánh dấu link sửa được (in bằng <%- %>)
//
// Ở chế độ xem thường, ed() in ra đúng chuỗi đã escape — không thêm thẻ nào — nên HTML mà khách
// nhận được giống hệt trước khi có tính năng này.
async function loadSiteContent(req, res, next) {
  let map;
  try {
    map = await getContentMap();
  } catch (err) {
    // Nội dung là phần phụ trợ: nếu DB lỗi thì vẫn phải render được trang bằng nội dung mặc
    // định trong code, không được để cả website chết theo.
    console.error('Không nạp được nội dung động, dùng nội dung mặc định:', err.message);
    map = new Map();
  }

  const editable = canEditContent(req.user);
  const editMode = editable && req.query.edit === '1';

  const rawValue = (key) => {
    const stored = map.get(key);
    return stored === undefined || stored === null ? null : stored;
  };

  const resolve = (key, fallback) => {
    const stored = rawValue(key);
    if (stored !== null) return stored;
    return fallback === undefined || fallback === null ? '' : String(fallback);
  };

  res.locals.editable = editable;
  res.locals.editMode = editMode;
  // Link để bật chế độ sửa trên chính trang đang xem (giữ nguyên các tham số query khác).
  res.locals.editUrl = req.originalUrl.includes('?')
    ? req.originalUrl + '&edit=1'
    : req.originalUrl + '?edit=1';

  res.locals.txt = resolve;

  res.locals.ed = (key, fallback, options) => {
    const value = resolve(key, fallback);
    const html = escapeHtml(value).replace(/\n/g, '<br>');
    if (!editMode) return html;
    const multiline = !!(options && options.multiline);
    const defaultText = fallback === undefined || fallback === null ? '' : String(fallback);
    return '<span class="ce-text"'
      + ' data-ce-key="' + escapeHtml(key) + '"'
      + ' data-ce-multiline="' + (multiline ? '1' : '0') + '"'
      + ' data-ce-default="' + escapeHtml(defaultText) + '"'
      + ' data-ce-overridden="' + (rawValue(key) !== null ? '1' : '0') + '"'
      + ' contenteditable="true" spellcheck="false">' + html + '</span>';
  };

  res.locals.pic = (key, fallback) => rawValue(key) || fallback || null;

  res.locals.picAttr = (key) => (editMode ? ' data-ce-img="' + escapeHtml(key) + '"' : '');

  res.locals.lnk = (key, fallback) => resolve(key, fallback) || '#';

  res.locals.lnkAttr = (key) => (editMode
    ? ' data-ce-link="' + escapeHtml(key) + '"'
      + ' data-ce-overridden="' + (rawValue(key) !== null ? '1' : '0') + '"'
    : '');

  next();
}

// Đặt bản "rỗng" của các hàm trợ giúp ở mức app.locals.
//
// Lý do: trang lỗi 500 được render từ global error handler, và lỗi có thể xảy ra TRƯỚC khi
// middleware loadSiteContent chạy (ví dụ lỗi trong loadSiteSettings). Lúc đó res.locals chưa có
// txt/ed/pic..., mà views/partials/header.ejs lại gọi chúng — trang lỗi sẽ tự lỗi thêm một lần
// nữa. Bản rỗng này luôn trả về giá trị mặc định trong code nên trang lỗi vẫn hiển thị được.
function installContentDefaults(app) {
  app.locals.editable = false;
  app.locals.editMode = false;
  app.locals.editUrl = '/?edit=1';
  app.locals.txt = (key, fallback) => (fallback === undefined || fallback === null ? '' : String(fallback));
  app.locals.ed = (key, fallback) => escapeHtml(
    fallback === undefined || fallback === null ? '' : String(fallback),
  ).replace(/\n/g, '<br>');
  app.locals.pic = (key, fallback) => fallback || null;
  app.locals.picAttr = () => '';
  app.locals.lnk = (key, fallback) => (fallback === undefined || fallback === null ? '#' : String(fallback)) || '#';
  app.locals.lnkAttr = () => '';
}

module.exports = {
  loadSiteContent,
  installContentDefaults,
  getContentMap,
  invalidateCache,
  canEditContent,
  setContent,
  resetContent,
  isValidKey,
  normalizeText,
  normalizeLink,
  escapeHtml,
};
