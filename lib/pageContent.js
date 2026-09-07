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
    homeAboutTitle: 'HỌC VIỆN ĐỔI MỚI SÁNG TẠO STEM VIỆT NAM',
    homeMissionTitle: 'Sứ mệnh',
    homeMissionText: 'Kiến tạo hệ sinh thái giáo dục STEM cho nhà trường, giáo viên và học sinh Việt Nam, nuôi dưỡng tư duy sáng tạo, năng lực thực hành và bản lĩnh hội nhập.',
    homeVisionTitle: 'Tầm nhìn',
    homeVisionText: 'Trở thành Học viện tiên phong trong giáo dục STEM và công nghệ số tại Việt Nam, tạo ra giá trị bền vững và vươn tầm tri thức quốc tế.',
    homeCoreValuesTitle: 'Giá trị cốt lõi',
    homeCoreValue1: 'Đổi mới & Sáng tạo',
    homeCoreValue2: 'Chất lượng & Hiệu quả',
    homeCoreValue3: 'Tận tâm & Đồng hành',
    homeCoreValue4: 'Trách nhiệm & Nhân văn',
    homeWhyTitle: 'NĂNG LỰC NỔI BẬT CỦA VSIA',
    homeWhyItem1Title: 'Năng lực quản trị dự án cấp quốc gia',
    homeWhyItem1Text: 'Là đơn vị điều phối Chương trình tập huấn STEM Innovation Petrovietnam, VSIA khẳng định uy tín và năng lực triển khai các dự án giáo dục quy mô lớn theo tiêu chuẩn khắt khe.',
    homeWhyItem2Title: 'Hội đồng cố vấn và khoa học',
    homeWhyItem2Text: 'Mọi chương trình đào tạo và giải pháp của VSIA đều được bảo chứng bởi Hội đồng cố vấn gồm các giáo sư, phó giáo sư, tiến sĩ và thạc sĩ giàu kinh nghiệm, đảm bảo chiều sâu học thuật và cập nhật xu hướng quốc tế.',
    homeWhyItem3Title: 'Hệ sinh thái giải pháp đồng bộ',
    homeWhyItem3Text: 'VSIA không chỉ cung cấp công cụ mà còn giải quyết bài toán giáo dục một cách triệt để thông qua mô hình tích hợp: Thiết kế không gian - Xây dựng chương trình - Đào tạo con người - Vận hành hiệu quả.',
    homeBusinessEyebrow: 'Lĩnh vực hoạt động',
    homeBusiness1Title: 'ĐÀO TẠO BỒI DƯỠNG CHUYÊN MÔN',
    homeBusiness1Text: 'Tổ chức các khóa đào tạo, bồi dưỡng nâng cao năng lực sư phạm và làm chủ công nghệ cho đội ngũ cán bộ quản lý, giáo viên các cấp.',
    homeBusiness2Title: 'TỔ CHỨC & THẨM ĐỊNH CUỘC THI, SỰ KIỆN',
    homeBusiness2Text: 'Đơn vị tổ chức, điều phối và tư vấn chuyên môn cho các sân chơi công nghệ, ngày hội sáng tạo, giải đấu Robotics từ cấp trường đến cấp quốc gia.',
    homeBusiness3Title: 'THIẾT KẾ VÀ CHUYỂN GIAO CHƯƠNG TRÌNH GIÁO DỤC',
    homeBusiness3Text: 'Cung cấp giải pháp toàn diện từ thiết kế không gian vật lý đến khung chương trình học liệu cho các nhà trường và đối tác doanh nghiệp, địa phương.',
    homeLearnMoreText: 'Tìm hiểu thêm →',
    homeTrainingEyebrow: 'Chương trình đào tạo',
    homeTrainingTitle: 'CÁC KHOÁ ĐÀO TẠO STEM DÀNH CHO GIÁO VIÊN',
    homeTrainingLead: 'Do VSIA tổ chức, dành cho giáo viên các cấp trên toàn quốc.',
    homeTrainingEmpty: 'Chưa có khoá học nào. Chạy node seed.js để thêm dữ liệu mẫu.',
    homeViewAllText: 'Xem tất cả',
    homeGalleryEyebrow: 'Hình ảnh',
    homeGalleryTitle: 'DỰ ÁN VÀ HOẠT ĐỘNG STEM NỔI BẬT',
    homeGalleryLead: 'VSIA là đơn vị triển khai CHƯƠNG TRÌNH TẬP HUẤN STEM INNOVATION PETROVIETNAM',
    homeGalleryEmpty: 'Chưa có ảnh/video, thêm ở trang quản trị (/admin/thu-vien).',
    homeGalleryViewAllText: 'Xem tất cả →',
    homeNewsEyebrow: 'TIN TỨC VÀ SỰ KIỆN',
    homeNewsTitle: 'TIN TỨC VÀ SỰ KIỆN GIÁO DỤC STEM',
    homeNewsEmpty: 'Chưa có bài viết nào.',
    homeTeamEyebrow: 'Đội ngũ',
    homeTeamTitle: 'HỘI ĐỒNG CỐ VẤN VÀ KHOA HỌC',
    homeTeamLead: 'Đội ngũ cố vấn chuyên môn đồng hành cùng VSIA trong các chương trình giáo dục STEM.',
    homeTeamEmpty: 'Chưa có thông tin Hội đồng chuyên gia. Thêm ở trang quản trị (/admin/doi-ngu).',
    homePartnersEyebrow: 'Đối tác đồng hành',
    homePartnersTitle: 'CÁC ĐƠN VỊ, TỔ CHỨC ĐỒNG HÀNH CÙNG VSIA',
    homePartnersEmpty: 'Chưa có đối tác nào. Thêm ở trang quản trị (/admin/doi-tac).',
    homeCtaTitle: 'ĐỒNG HÀNH PHÁT TRIỂN STEM BỀN VỮNG TẠI CÁC ĐỊA PHƯƠNG VÀ NHÀ TRƯỜNG',
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
  if (pageKey === 'home' && ['Vì sao chọn VSIA?', 'Năng lực nổi bật của VSIA'].includes(doc.homeAboutTitle)) {
    doc.homeAboutTitle = defaults.homeAboutTitle;
    await doc.save();
  }
  if (pageKey === 'home') {
    const businessTitleUpdates = {
      'Đào tạo & Bồi dưỡng chuyên môn': 'ĐÀO TẠO BỒI DƯỠNG CHUYÊN MÔN',
      'Tổ chức & Thẩm định cuộc thi, sự kiện': 'TỔ CHỨC & THẨM ĐỊNH CUỘC THI, SỰ KIỆN',
      'Thiết kế & chuyển giao Chương trình giáo dục': 'THIẾT KẾ VÀ CHUYỂN GIAO CHƯƠNG TRÌNH GIÁO DỤC',
    };
    let businessTitlesChanged = false;
    ['homeBusiness1Title', 'homeBusiness2Title', 'homeBusiness3Title'].forEach((field) => {
      const updatedTitle = businessTitleUpdates[doc[field]];
      if (updatedTitle) {
        doc[field] = updatedTitle;
        businessTitlesChanged = true;
      }
    });
    ['homeBusiness1Text', 'homeBusiness2Text', 'homeBusiness3Text'].forEach((field) => {
      if (!doc[field] && defaults[field]) {
        doc[field] = defaults[field];
        businessTitlesChanged = true;
      }
    });
    if (!doc.homeGalleryLead && defaults.homeGalleryLead) {
      doc.homeGalleryLead = defaults.homeGalleryLead;
      businessTitlesChanged = true;
    }
    if (businessTitlesChanged) await doc.save();

    const newsTitleUpdates = {
      'Tin tức & bài viết': 'TIN TỨC VÀ SỰ KIỆN GIÁO DỤC STEM',
      'Hoạt động nổi bật': 'DỰ ÁN VÀ HOẠT ĐỘNG STEM NỔI BẬT',
      'DỰ ÁN VÀ HOẠT ĐỘNG STEM NỔI BẬT': 'TIN TỨC VÀ SỰ KIỆN GIÁO DỤC STEM',
    };
    let newsTitlesChanged = false;
    ['homeNewsEyebrow', 'homeNewsTitle'].forEach((field) => {
      const updatedTitle = newsTitleUpdates[doc[field]];
      if (updatedTitle) {
        doc[field] = updatedTitle;
        newsTitlesChanged = true;
      }
    });
    if (doc.homeNewsEyebrow === 'TIN TỨC VÀ SỰ KIỆN GIÁO DỤC STEM') {
      doc.homeNewsEyebrow = defaults.homeNewsEyebrow;
      newsTitlesChanged = true;
    }
    if (newsTitlesChanged) await doc.save();

    const headingUpdates = {
      'Các khoá đào tạo STEM dành cho giáo viên': 'CÁC KHOÁ ĐÀO TẠO STEM DÀNH CHO GIÁO VIÊN',
      'Dự án STEM nổi bật': 'DỰ ÁN VÀ HOẠT ĐỘNG STEM NỔI BẬT',
      'DỰ ÁN STEM NỔI BẬT': 'DỰ ÁN VÀ HOẠT ĐỘNG STEM NỔI BẬT',
      'Hội đồng cố vấn và khoa học': 'HỘI ĐỒNG CỐ VẤN VÀ KHOA HỌC',
      'Các đơn vị, tổ chức đồng hành cùng VSIA': 'CÁC ĐƠN VỊ, TỔ CHỨC ĐỒNG HÀNH CÙNG VSIA',
      'Đồng hành phát triển STEM bền vững tại các địa phương và nhà trường': 'ĐỒNG HÀNH PHÁT TRIỂN STEM BỀN VỮNG TẠI CÁC ĐỊA PHƯƠNG VÀ NHÀ TRƯỜNG',
      'Năng lực nổi bật của VSIA': 'NĂNG LỰC NỔI BẬT CỦA VSIA',
    };
    let headingsChanged = false;
    ['homeWhyTitle', 'homeTrainingTitle', 'homeGalleryTitle', 'homeTeamTitle', 'homePartnersTitle', 'homeCtaTitle'].forEach((field) => {
      const updatedTitle = headingUpdates[doc[field]];
      if (updatedTitle) {
        doc[field] = updatedTitle;
        headingsChanged = true;
      }
    });
    if (headingsChanged) await doc.save();
  }
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
