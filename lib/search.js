// Bỏ dấu tiếng Việt + hạ chữ thường, để so khớp không phân biệt dấu/hoa-thường
// (vd gõ "hoc" vẫn tìm ra "học").
function normalizeSearchText(str) {
  return (str || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

// Khớp theo từng từ trong query (không cần đúng thứ tự) — vd query "hoc robot" khớp
// "Mang STEM vào lớp học Robotics" vì cả 2 từ đều xuất hiện đâu đó trong target.
function matchesSearchQuery(target, query) {
  const words = normalizeSearchText(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const normTarget = normalizeSearchText(target);
  return words.every((w) => normTarget.includes(w));
}

module.exports = { normalizeSearchText, matchesSearchQuery };
