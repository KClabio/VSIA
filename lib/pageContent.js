const PageContent = require('../models/PageContent');

const PAGE_DEFAULTS = {
  home: {
    label: 'Trang chủ',
    heroBadge: 'Chương trình đào tạo & giải pháp STEM',
    heroTitleLine1: 'VIETNAM STEM INNOVATION ACADEMY',
    heroTitleLine2: 'Vươn tầm Việt Nam',
    heroSubtitle: 'Kiến tạo thế hệ đổi mới - Vươn tầm Việt Nam',
    heroCtaText: 'Xem giải pháp tổng thể',
    heroCtaLink: '/giai-phap',
    homeHeroContactText: 'Liên hệ tư vấn ngay →',
    homeHeroCoursesText: 'Khoá học',
    homeAboutEyebrow: 'Về VSIA',
    homeAboutTitle: 'Vì sao chọn VSIA?',
    homeMissionTitle: 'Sứ mệnh',
    homeMissionText: 'Kiến tạo hệ sinh thái giáo dục STEM cho nhà trường, giáo viên và học sinh Việt Nam, nuôi dưỡng tư duy sáng tạo, năng lực thực hành và bản lĩnh hội nhập.',
    homeVisionTitle: 'Tầm nhìn',
    homeVisionText: 'Trở thành Học viện tiên phong trong giáo dục STEM và công nghệ số tại Việt Nam, tạo ra giá trị bền vững và vươn tầm tri thức quốc tế.',
    homeCoreValuesTitle: 'Giá trị cốt lõi',
    homeCoreValue1: 'Đổi mới & Sáng tạo',
    homeCoreValue2: 'Chất lượng & Hiệu quả',
    homeCoreValue3: 'Tận tâm & Đồng hành',
    homeCoreValue4: 'Trách nhiệm & Nhân văn',
    homeWhyTitle: 'Năng lực nổi bật của VSIA',
    homeWhyItem1Title: 'Năng lực quản trị dự án cấp quốc gia',
    homeWhyItem1Text: 'Là đơn vị điều phối Chương trình tập huấn STEM Innovation Petrovietnam, VSIA khẳng định uy tín và năng lực triển khai các dự án giáo dục quy mô lớn theo tiêu chuẩn khắt khe.',
    homeWhyItem2Title: 'Hội đồng cố vấn và khoa học',
    homeWhyItem2Text: 'Mọi chương trình đào tạo và giải pháp của VSIA đều được bảo chứng bởi Hội đồng cố vấn gồm các giáo sư, phó giáo sư, tiến sĩ và thạc sĩ giàu kinh nghiệm, đảm bảo chiều sâu học thuật và cập nhật xu hướng quốc tế.',
    homeWhyItem3Title: 'Hệ sinh thái giải pháp đồng bộ',
    homeWhyItem3Text: 'VSIA không chỉ cung cấp công cụ mà còn giải quyết bài toán giáo dục một cách triệt để thông qua mô hình tích hợp: Thiết kế không gian - Xây dựng chương trình - Đào tạo con người - Vận hành hiệu quả.',
    homeBusinessEyebrow: 'Lĩnh vực hoạt động',
    homeBusiness1Title: 'Đào tạo & Bồi dưỡng chuyên môn',
    homeBusiness2Title: 'Tổ chức & Thẩm định cuộc thi, sự kiện',
    homeBusiness3Title: 'Thiết kế & chuyển giao Chương trình giáo dục',
    homeLearnMoreText: 'Tìm hiểu thêm →',
    homeTrainingEyebrow: 'Chương trình đào tạo',
    homeTrainingTitle: 'Các khoá đào tạo STEM dành cho giáo viên',
    homeTrainingLead: 'Do VSIA tổ chức, dành cho giáo viên các cấp trên toàn quốc.',
    homeTrainingEmpty: 'Chưa có khoá học nào. Chạy node seed.js để thêm dữ liệu mẫu.',
    homeViewAllText: 'Xem tất cả',
    homeGalleryEyebrow: 'Hình ảnh',
    homeGalleryTitle: 'Dự án STEM nổi bật',
    homeGalleryEmpty: 'Chưa có ảnh/video, thêm ở trang quản trị (/admin/thu-vien).',
    homeGalleryViewAllText: 'Xem tất cả →',
    homeNewsEyebrow: 'Tin tức & bài viết',
    homeNewsTitle: 'Hoạt động nổi bật',
    homeNewsEmpty: 'Chưa có bài viết nào.',
    homeTeamEyebrow: 'Đội ngũ',
    homeTeamTitle: 'Hội đồng cố vấn và khoa học',
    homeTeamLead: 'Đội ngũ cố vấn chuyên môn đồng hành cùng VSIA trong các chương trình giáo dục STEM.',
    homeTeamEmpty: 'Chưa có thông tin Hội đồng chuyên gia. Thêm ở trang quản trị (/admin/doi-ngu).',
    homePartnersEyebrow: 'Đối tác đồng hành',
    homePartnersTitle: 'Các đơn vị, tổ chức đồng hành cùng VSIA',
    homePartnersEmpty: 'Chưa có đối tác nào. Thêm ở trang quản trị (/admin/doi-tac).',
    homeCtaTitle: 'Đồng hành phát triển STEM bền vững tại các địa phương và nhà trường',
    homeCtaText: 'VSIA tư vấn, thiết kế và đồng hành triển khai giải pháp giáo dục STEM toàn diện — từ đề án đến đánh giá.',
    homeContactText: 'Liên hệ tư vấn →',
    homeActivityText: 'Xem lịch hoạt động',
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
  'lien-he': {
    label: 'Liên hệ',
    heroBadge: 'Kết nối với VSIA',
    heroTitleLine1: 'Liên hệ',
    heroTitleLine2: 'với chúng tôi',
    heroSubtitle: 'VSIA luôn sẵn sàng lắng nghe và đồng hành cùng nhà trường, giáo viên trên hành trình giáo dục STEM.',
    heroCtaText: 'Đăng ký tư vấn',
    heroCtaLink: '#',
  },
  'hoi-thao': {
    label: 'Hội thảo STEM trực tuyến',
    heroBadge: 'Đào tạo và bồi dưỡng',
    heroTitleLine1: 'Hội thảo STEM',
    heroTitleLine2: 'trực tuyến',
    heroSubtitle: 'Chuỗi hội thảo, webinar chia sẻ kinh nghiệm và phương pháp giáo dục STEM từ VSIA cùng các chuyên gia — xem lại miễn phí qua video.',
    heroCtaText: 'Đăng ký nhận thông báo',
    heroCtaLink: '#',
  },
};

async function getPageContent(pageKey) {
  let doc = await PageContent.findOne({ pageKey });
  const defaults = PAGE_DEFAULTS[pageKey] || {};
  if (!doc) doc = await PageContent.create({ pageKey, ...defaults });
  Object.entries(defaults).forEach(([field, value]) => {
    if (doc[field] === undefined || doc[field] === null) doc[field] = value;
  });
  return doc;
}

async function getAllPageContents() {
  const keys = Object.keys(PAGE_DEFAULTS);
  const docs = await Promise.all(keys.map((key) => getPageContent(key)));
  return docs.map((doc, i) => ({ key: keys[i], label: PAGE_DEFAULTS[keys[i]].label, ...doc.toObject() }));
}

module.exports = { getPageContent, getAllPageContents, PAGE_DEFAULTS };
