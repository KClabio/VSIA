const PageContent = require('../models/PageContent');

const PAGE_DEFAULTS = {
  home: {
    label: 'Trang chủ',
    heroBadge: 'Chương trình đào tạo & giải pháp STEM',
    heroTitleLine1: 'Kiến tạo nguồn nhân lực',
    heroTitleLine2: 'STEM Việt Nam',
    heroSubtitle: 'Bệ đỡ tri thức nối chuyên gia và giáo viên trong các chương trình bồi dưỡng, đào tạo giáo dục STEM cho địa phương và nhà trường.',
    heroCtaText: 'Xem giải pháp tổng thể',
    heroCtaLink: '/giai-phap',
  },
  'giai-phap': {
    label: 'Giải pháp',
    heroBadge: 'Về VSIA',
    heroTitleLine1: 'Giải pháp',
    heroTitleLine2: 'giáo dục STEM tổng thể',
    heroSubtitle: 'VSIA đồng hành cùng nhà trường và địa phương xây dựng phong trào giáo dục STEM bền vững, từ con người, chương trình đến cơ sở vật chất.',
    heroCtaText: 'Liên hệ hợp tác',
    heroCtaLink: 'mailto:taphuan@vsia.edu.vn',
  },
  'lab-consulting': {
    label: 'Tư vấn phòng Lab',
    heroBadge: 'Dịch vụ tư vấn',
    heroTitleLine1: 'Tư vấn thiết kế',
    heroTitleLine2: 'phòng Lab STEM',
    heroSubtitle: 'Đồng hành cùng nhà trường từ khảo sát không gian đến triển khai, xây dựng phòng học STEM đạt chuẩn, phù hợp ngân sách và cấp học.',
    heroCtaText: 'Liên hệ tư vấn',
    heroCtaLink: 'mailto:taphuan@vsia.edu.vn',
  },
  'stem-events': {
    label: 'Ngày hội & Cuộc thi',
    heroBadge: 'Sân chơi STEM',
    heroTitleLine1: 'Ngày hội &',
    heroTitleLine2: 'cuộc thi STEM',
    heroSubtitle: 'Tạo sân chơi để học sinh trải nghiệm, giao lưu và thể hiện năng lực sáng tạo qua các hoạt động, cuộc thi STEM.',
    heroCtaText: 'Đăng ký tổ chức tại trường',
    heroCtaLink: 'mailto:taphuan@vsia.edu.vn',
  },
};

async function getPageContent(pageKey) {
  let doc = await PageContent.findOne({ pageKey });
  if (!doc) {
    const defaults = PAGE_DEFAULTS[pageKey] || {};
    doc = await PageContent.create({ pageKey, ...defaults });
  }
  return doc;
}

async function getAllPageContents() {
  const keys = Object.keys(PAGE_DEFAULTS);
  const docs = await Promise.all(keys.map((key) => getPageContent(key)));
  return docs.map((doc, i) => ({ key: keys[i], label: PAGE_DEFAULTS[keys[i]].label, ...doc.toObject() }));
}

module.exports = { getPageContent, getAllPageContents, PAGE_DEFAULTS };
