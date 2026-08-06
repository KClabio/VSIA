const DATE_RE = /^(\d{2})\/(\d{2})\/(\d{4})$/;

// Chấp nhận "dd/mm/yyyy", trả về Date nếu là ngày hợp lệ (chặn kiểu 31/02/2026), null nếu không.
function parseVNDate(str) {
  const m = DATE_RE.exec((str || '').trim());
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function isValidVNDate(str) {
  return !!parseVNDate(str);
}

// Dùng cho các ô ngày riêng lẻ (vd weekStart/weekEnd của 1 tuần học) — để trống thì bỏ qua,
// có nhập thì bắt buộc đúng định dạng dd/mm/yyyy và là ngày có thật.
function validateOptionalVNDate(raw, label) {
  const trimmed = (raw || '').trim();
  if (!trimmed) return null;
  if (!isValidVNDate(trimmed)) return `${label} phải theo định dạng dd/mm/yyyy và là ngày hợp lệ.`;
  return null;
}

// Dùng cho ô nhập cả khoảng ngày trong 1 field text (vd "07/06/2026 - 30/08/2026").
function validateOptionalVNDateRange(raw, label) {
  const trimmed = (raw || '').trim();
  if (!trimmed) return null;
  const parts = trimmed.split('-').map((p) => p.trim());
  if (parts.length !== 2) return `${label} phải theo định dạng "dd/mm/yyyy - dd/mm/yyyy".`;
  const [start, end] = parts.map(parseVNDate);
  if (!start || !end) return `${label} phải theo định dạng "dd/mm/yyyy - dd/mm/yyyy" với ngày hợp lệ.`;
  if (end < start) return `${label}: ngày kết thúc phải sau ngày bắt đầu.`;
  return null;
}

module.exports = { parseVNDate, isValidVNDate, validateOptionalVNDate, validateOptionalVNDateRange };
