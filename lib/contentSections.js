// SINH TỰ ĐỘNG — không sửa tay.
// Khai báo các phần nội dung hiện trong form quản trị của từng trang.
//
// Cấu trúc và nhãn do người viết; giá trị "def" được rút trực tiếp từ các file .ejs nên form
// luôn hiện đúng nội dung đang chạy trên web, kể cả khi database chưa có bản ghi đè nào.
//
// type: text | textarea | link | image
//   - text/textarea/link: lưu vào collection sitecontents (hoặc PageContent nếu khoá dạng page.*)
//   - image: khoá dạng settings.<field>, lưu vào SiteSettings
//
// Muốn thêm ô mới: thêm lời gọi ed()/txt()/lnk()/picAttr() trong view, rồi khai báo khoá ở đây.

const CONTENT_SECTIONS = {
  "home": {
    label: "Trang chủ",
    sections: [
      {
        title: "Menu điều hướng",
        note: "Áp dụng cho toàn bộ website. Sửa ở đây là mọi trang đổi theo.",
        fields: [
          { key: "nav.home.label", label: "Mục 1 — Chữ", type: "text", def: "TRANG CHỦ" },
          { key: "nav.home.link", label: "Mục 1 — Link", type: "link", def: "/" },
          { key: "nav.fields.label", label: "Mục 2 — Chữ (menu có danh mục con)", type: "text", def: "LĨNH VỰC HOẠT ĐỘNG" },
          { key: "nav.fields.training.label", label: "Danh mục con 1 — Chữ", type: "text", def: "ĐÀO TẠO BỒI DƯỠNG CHUYÊN MÔN" },
          { key: "nav.fields.training.link", label: "Danh mục con 1 — Link", type: "link", def: "/khoa-hoc" },
          { key: "nav.fields.webinar.label", label: "Danh mục con 1.1 — Chữ", type: "text", def: "Hội thảo STEM trực tuyến" },
          { key: "nav.fields.webinar.link", label: "Danh mục con 1.1 — Link", type: "link", def: "/hoi-thao-truc-tuyen" },
          { key: "nav.fields.transfer.label", label: "Danh mục con 2 — Chữ", type: "text", def: "THIẾT KẾ VÀ CHUYỂN GIAO CHƯƠNG TRÌNH GIÁO DỤC" },
          { key: "nav.fields.transfer.link", label: "Danh mục con 2 — Link", type: "link", def: "/tu-van-phong-lab" },
          { key: "nav.fields.events.label", label: "Danh mục con 3 — Chữ", type: "text", def: "TỔ CHỨC NGÀY HỘI & CUỘC THI STEM" },
          { key: "nav.fields.events.link", label: "Danh mục con 3 — Link", type: "link", def: "/ngay-hoi-cuoc-thi" },
          { key: "nav.solution.label", label: "Mục 3 — Chữ", type: "text", def: "GIẢI PHÁP" },
          { key: "nav.solution.link", label: "Mục 3 — Link", type: "link", def: "/giai-phap" },
          { key: "nav.courses.label", label: "Mục 4 — Chữ", type: "text", def: "KHOÁ HỌC" },
          { key: "nav.courses.link", label: "Mục 4 — Link", type: "link", def: "/khoa-hoc" },
          { key: "nav.news.label", label: "Mục 5 — Chữ", type: "text", def: "TIN TỨC" },
          { key: "nav.news.link", label: "Mục 5 — Link", type: "link", def: "/tin-tuc" },
          { key: "nav.cta.label", label: "Nút nổi bật — Chữ", type: "text", def: "Hợp tác" },
          { key: "nav.cta.link", label: "Nút nổi bật — Link", type: "link", def: "/hop-tac" },
        ],
      },
      {
        title: "Chân trang (Footer)",
        note: "Áp dụng cho toàn bộ website.",
        fields: [
          { key: "footer.marquee.text", label: "Dòng chữ chạy phía trên footer", type: "text", def: "VSIA STEM" },
          { key: "footer.legal.name", label: "Tên công ty", type: "text", def: "Công ty TNHH Học viện Đổi mới Sáng tạo STEM Việt Nam" },
          { key: "footer.legal.intl", label: "Tên công ty tiếng Anh", type: "text", def: "Vietnam STEM Innovation Academy Company Limited" },
          { key: "footer.social.heading", label: "Tiêu đề cột mạng xã hội", type: "text", def: "Kết nối với VSIA" },
          { key: "footer.social.facebook.label", label: "Facebook — Chữ", type: "text", def: "Fanpage Facebook" },
          { key: "footer.social.facebook.link", label: "Facebook — Link", type: "link", def: "https://www.facebook.com/profile.php?id=61594252493879" },
          { key: "footer.social.group.label", label: "Nhóm Facebook — Chữ", type: "text", def: "Nhóm Facebook" },
          { key: "footer.social.group.link", label: "Nhóm Facebook — Link", type: "link", def: "https://www.facebook.com/share/g/1EyHzgKThb/" },
          { key: "footer.social.youtube.label", label: "YouTube — Chữ", type: "text", def: "Kênh YouTube" },
          { key: "footer.social.youtube.link", label: "YouTube — Link", type: "link", def: "https://www.youtube.com/@VSiA-taphuan" },
          { key: "footer.contact.heading", label: "Tiêu đề cột liên hệ", type: "text", def: "Liên hệ" },
          { key: "footer.contact.phone.label", label: "Điện thoại — Chữ", type: "text", def: "0862.26.05.26" },
          { key: "footer.contact.phone.link", label: "Điện thoại — Link (Zalo)", type: "link", def: "https://zalo.me/0862260526" },
          { key: "footer.contact.website.label", label: "Website — Chữ", type: "text", def: "www.vsia.edu.vn" },
          { key: "footer.contact.website.link", label: "Website — Link", type: "link", def: "https://www.vsia.edu.vn" },
          { key: "footer.contact.email.label", label: "Email — Chữ", type: "text", def: "info@vsia.edu.vn" },
          { key: "footer.contact.email.link", label: "Email — Link", type: "link", def: "https://mail.google.com/mail/u/0/?fs=1&to=info%40vsia.edu.vn&tf=cm" },
          { key: "footer.contact.address", label: "Địa chỉ", type: "textarea", def: "Số 23, Ngõ 9, Xóm Trung Thanh, Thôn Hữu Từ, Xã Đại Thanh, TP. Hà Nội" },
          { key: "footer.bottom.copyright", label: "Dòng bản quyền", type: "text", def: "VSIA. All rights reserved." },
          { key: "footer.bottom.slogan", label: "Slogan cuối trang", type: "text", def: "Kiến tạo thế hệ đổi mới - Vươn tầm Việt Nam." },
        ],
      },
      {
        title: "Hộp chat trợ lý ảo",
        note: "Áp dụng cho toàn bộ website.",
        fields: [
          { key: "chat.button.title", label: "Chú thích nút chat", type: "text", def: "Chat với trợ lý AI" },
          { key: "chat.title", label: "Tiêu đề hộp chat", type: "text", def: "Trợ lý VSIA" },
          { key: "chat.greeting", label: "Câu chào đầu tiên", type: "textarea", def: "Xin chào! Tôi là trợ lý ảo của VSIA 👋 Bạn cần tư vấn gì về khoá học, thiết kế phòng Lab hay ngày hội STEM không?" },
          { key: "chat.input.placeholder", label: "Gợi ý trong ô nhập", type: "text", def: "Nhập câu hỏi của bạn..." },
        ],
      },
      {
        title: "Form đăng ký tư vấn",
        note: "Áp dụng cho toàn bộ website. Đây là form hiện lên khi khách bấm nút phong bì hoặc các nút \"Liên hệ tư vấn\".",
        fields: [
          { key: "contact.button.title", label: "Chú thích nút mở form", type: "text", def: "Đăng ký tư vấn" },
          { key: "contact.modal.title", label: "Tiêu đề form", type: "text", def: "Đăng ký tư vấn" },
          { key: "contact.modal.lead", label: "Mô tả form", type: "textarea", def: "Để lại thông tin, đội ngũ VSIA sẽ liên hệ tư vấn cho bạn sớm nhất." },
          { key: "contact.form.name.label", label: "Nhãn ô Họ tên", type: "text", def: "Họ tên" },
          { key: "contact.form.name.placeholder", label: "Gợi ý ô Họ tên", type: "text", def: "Nguyễn Văn A" },
          { key: "contact.form.phone.label", label: "Nhãn ô Điện thoại", type: "text", def: "Số điện thoại" },
          { key: "contact.form.phone.placeholder", label: "Gợi ý ô Điện thoại", type: "text", def: "0912 345 678" },
          { key: "contact.form.email.label", label: "Nhãn ô Email", type: "text", def: "Email" },
          { key: "contact.form.email.placeholder", label: "Gợi ý ô Email", type: "text", def: "ten@email.com" },
          { key: "contact.form.message.label", label: "Nhãn ô Nội dung", type: "text", def: "Nội dung cần tư vấn" },
          { key: "contact.form.message.placeholder", label: "Gợi ý ô Nội dung", type: "text", def: "Bạn cần hỗ trợ về vấn đề gì?" },
          { key: "contact.form.submit", label: "Chữ trên nút gửi", type: "text", def: "Gửi yêu cầu" },
        ],
      },
      {
        title: "Khối Lộ trình đào tạo",
        note: "Hiện ở trang chủ, trang Giải pháp và trang Khoá học. Nội dung 5 chương trình sửa ở phần \"Nội dung chương trình đào tạo\" phía trên.",
        fields: [
          { key: "roadmap.heading", label: "Tiêu đề khối", type: "text", def: "CÁC CHƯƠNG TRÌNH TẬP HUẤN VÀ ĐÀO TẠO GIÁO VIÊN" },
          { key: "roadmap.subheading", label: "Mô tả khối", type: "textarea", def: "Lộ trình cơ bản đến chuyên sâu, từ kỹ thuật thiết bị đến hướng dẫn học sinh nghiên cứu khoa học." },
        ],
      },
    ],
  },
  "giai-phap": {
    label: "Giải pháp",
    sections: [
      {
        title: "Đầu trang — 3 thẻ nhỏ và nút thứ hai",
        note: "Badge, tiêu đề và nút chính của đầu trang sửa ở phần \"Giao diện đầu trang\" phía trên.",
        fields: [
          { key: "giaiphap.hero.badge1", label: "Thẻ nhỏ 1", type: "text", def: "Đồng bộ chương trình – thiết bị – con người" },
          { key: "giaiphap.hero.badge2", label: "Thẻ nhỏ 2", type: "text", def: "Bám sát Chương trình GDPT 2018" },
          { key: "giaiphap.hero.badge3", label: "Thẻ nhỏ 3", type: "text", def: "Triển khai từ trường đến tỉnh" },
          { key: "giaiphap.hero.cta2.label", label: "Nút thứ hai — Chữ", type: "text", def: "Xem hệ sinh thái" },
          { key: "giaiphap.hero.cta2.link", label: "Nút thứ hai — Link", type: "link", def: "#he-sinh-thai" },
        ],
      },
      {
        title: "Khối Giải pháp tổng thể",
        fields: [
          { key: "giaiphap.overview.title", label: "Tiêu đề khối", type: "text", def: "GIẢI PHÁP GIÁO DỤC STEM TỔNG THỂ, TOÀN DIỆN" },
          { key: "giaiphap.showcase.badge", label: "Nhãn trên ảnh", type: "text", def: "STEM INNOVATION" },
          { key: "giaiphap.showcase.title", label: "Tiêu đề trên ảnh", type: "text", def: "Chương trình STEM Innovation" },
          { key: "giaiphap.showcase.text", label: "Mô tả trên ảnh", type: "textarea", def: "Đào tạo giáo viên, chuyển giao chương trình và thiết bị theo mô hình đồng bộ trên toàn quốc." },
        ],
      },
      {
        title: "4 bước triển khai",
        fields: [
          { key: "giaiphap.step1.title", label: "Bước 1 — Tiêu đề", type: "text", def: "Chương trình giáo dục STEM phổ cập đại trà" },
          { key: "giaiphap.step1.text", label: "Bước 1 — Mô tả", type: "textarea", def: "Bộ S3 STEM KIT — chương trình đóng gói đồng bộ, bám sát Chương trình GDPT 2018, có thể triển khai diện rộng." },
          { key: "giaiphap.step2.title", label: "Bước 2 — Tiêu đề", type: "text", def: "Chương trình học STEM AI Robotics" },
          { key: "giaiphap.step2.text", label: "Bước 2 — Mô tả", type: "textarea", def: "Ứng dụng hệ thống Robot VEX, phát triển tư duy thiết kế và lập trình cho học sinh." },
          { key: "giaiphap.step3.title", label: "Bước 3 — Tiêu đề", type: "text", def: "Tư vấn phòng thực hành STEM (STEM LAB)" },
          { key: "giaiphap.step3.text", label: "Bước 3 — Mô tả", type: "textarea", def: "Tư vấn thiết kế, thi công lắp đặt và xây dựng chương trình vận hành phòng Lab." },
          { key: "giaiphap.step3.linkLabel", label: "Bước 3 — Chữ link", type: "text", def: "Xem chi tiết →" },
          { key: "giaiphap.step3.link", label: "Bước 3 — Link", type: "link", def: "/tu-van-phong-lab" },
          { key: "giaiphap.step4.title", label: "Bước 4 — Tiêu đề", type: "text", def: "Đồng hành giáo dục STEM địa phương" },
          { key: "giaiphap.step4.text", label: "Bước 4 — Mô tả", type: "textarea", def: "Hỗ trợ triển khai và tham gia các cuộc thi về STEM, KHKT tại địa phương." },
          { key: "giaiphap.step4.linkLabel", label: "Bước 4 — Chữ link", type: "text", def: "Xem chi tiết →" },
          { key: "giaiphap.step4.link", label: "Bước 4 — Link", type: "link", def: "/ngay-hoi-cuoc-thi" },
        ],
      },
      {
        title: "Khối Hệ sinh thái — 4 thẻ",
        note: "Mỗi thẻ có thể để ảnh; nếu không có ảnh thì hiện icon mặc định.",
        fields: [
          { key: "giaiphap.eco.title", label: "Tiêu đề khối", type: "text", def: "HỆ SINH THÁI GIÁO DỤC STEM" },
          { key: "giaiphap.eco.subtitle", label: "Mô tả khối", type: "textarea", def: "Bốn trụ cột vận hành song song, tạo thành một hệ sinh thái giáo dục STEM bền vững cho nhà trường." },
          { key: "giaiphap.eco1.title", label: "Thẻ 1 — Tiêu đề", type: "text", def: "Xây dựng phong trào" },
          { key: "giaiphap.eco1.text", label: "Thẻ 1 — Mô tả", type: "textarea", def: "Giáo viên dạy, học sinh học tập - sáng tạo, phụ huynh đồng hành." },
          { key: "settings.ecoMovementImage", label: "Thẻ 1 — Ảnh", type: "image" },
          { key: "giaiphap.eco2.title", label: "Thẻ 2 — Tiêu đề", type: "text", def: "Đầu tư trang thiết bị" },
          { key: "giaiphap.eco2.text", label: "Thẻ 2 — Mô tả", type: "textarea", def: "Phòng thực hành STEM (STEM LAB) đạt chuẩn, phù hợp từng cấp học." },
          { key: "settings.ecoEquipmentImage", label: "Thẻ 2 — Ảnh", type: "image" },
          { key: "giaiphap.eco3.title", label: "Thẻ 3 — Tiêu đề", type: "text", def: "Các cuộc thi" },
          { key: "giaiphap.eco3.text", label: "Thẻ 3 — Mô tả", type: "textarea", def: "Tổ chức cuộc thi tại địa phương, tham gia cuộc thi quốc gia, quốc tế." },
          { key: "settings.ecoCompetitionImage", label: "Thẻ 3 — Ảnh", type: "image" },
          { key: "giaiphap.eco4.title", label: "Thẻ 4 — Tiêu đề", type: "text", def: "Tập huấn, đào tạo giáo viên" },
          { key: "giaiphap.eco4.text", label: "Thẻ 4 — Mô tả", type: "textarea", def: "Nâng cao năng lực giảng dạy STEM, tinh thần đổi mới sáng tạo." },
          { key: "settings.ecoTrainingImage", label: "Thẻ 4 — Ảnh", type: "image" },
        ],
      },
      {
        title: "Khối Dự án nổi bật",
        note: "Thêm, bớt ảnh dự án ở phần \"Ảnh và tài nguyên của trang\" phía trên.",
        fields: [
          { key: "giaiphap.projects.title", label: "Tiêu đề khối", type: "text", def: "DỰ ÁN NỔI BẬT" },
          { key: "giaiphap.projects.lead1", label: "Dòng mô tả 1", type: "text", def: "VSIA là đơn vị triển khai" },
          { key: "giaiphap.projects.lead2", label: "Dòng mô tả 2 (in đậm)", type: "text", def: "CHƯƠNG TRÌNH TẬP HUẤN STEM INNOVATION PETROVIETNAM" },
        ],
      },
      {
        title: "Dải kêu gọi cuối trang",
        fields: [
          { key: "giaiphap.cta.title", label: "Tiêu đề", type: "text", def: "Địa phương hoặc nhà trường bạn muốn xây dựng giáo dục STEM?" },
          { key: "giaiphap.cta.text", label: "Mô tả", type: "textarea", def: "VSIA tư vấn mô hình triển khai phù hợp với điều kiện thực tế — từ chương trình, thiết bị đến con người." },
          { key: "giaiphap.cta.button", label: "Chữ trên nút", type: "text", def: "Liên hệ hợp tác" },
        ],
      },
    ],
  },
  "su-kien": {
    label: "Tổ chức ngày hội & cuộc thi STEM",
    sections: [
      {
        title: "Đầu trang — 3 thẻ nhỏ và nút thứ hai",
        note: "Badge, tiêu đề và nút chính sửa ở phần \"Giao diện đầu trang\" phía trên.",
        fields: [
          { key: "sukien.hero.badge1", label: "Thẻ nhỏ 1", type: "text", def: "Từ cấp cơ sở đến quốc gia, quốc tế" },
          { key: "sukien.hero.badge2", label: "Thẻ nhỏ 2", type: "text", def: "Tư vấn chuyên môn & tổ chức" },
          { key: "sukien.hero.badge3", label: "Thẻ nhỏ 3", type: "text", def: "Đồng hành trọn gói tổ chức" },
          { key: "sukien.hero.cta2.label", label: "Nút thứ hai — Chữ", type: "text", def: "Xem hình thức tổ chức" },
          { key: "sukien.hero.cta2.link", label: "Nút thứ hai — Link", type: "link", def: "#hinh-thuc" },
        ],
      },
      {
        title: "Khối Hình thức tổ chức — 4 thẻ",
        fields: [
          { key: "sukien.forms.title", label: "Tiêu đề khối", type: "text", def: "HÌNH THỨC TỔ CHỨC" },
          { key: "sukien.forms.subtitle", label: "Mô tả khối", type: "textarea", def: "Đơn vị tổ chức, điều phối và tư vấn chuyên môn cho các sân chơi công nghệ, ngày hội sáng tạo, giải đấu Robotics từ cấp trường đến cấp quốc gia." },
          { key: "sukien.card1.title", label: "Thẻ 1 — Tiêu đề", type: "text", def: "Ngày hội trải nghiệm STEM" },
          { key: "sukien.card1.text", label: "Thẻ 1 — Mô tả", type: "textarea", def: "Các gian trải nghiệm Robotics, lập trình, khoa học vui... để học sinh toàn trường tham gia trực tiếp." },
          { key: "sukien.card2.title", label: "Thẻ 2 — Tiêu đề", type: "text", def: "Cuộc thi sáng tạo theo chủ đề" },
          { key: "sukien.card2.text", label: "Thẻ 2 — Mô tả", type: "textarea", def: "Học sinh làm việc nhóm, thực hiện sản phẩm STEM theo chủ đề do nhà trường và VSIA thống nhất." },
          { key: "sukien.card3.title", label: "Thẻ 3 — Tiêu đề", type: "text", def: "Hội đồng cố vấn chuyên môn" },
          { key: "sukien.card3.text", label: "Thẻ 3 — Mô tả", type: "textarea", def: "Đảm nhận vai trò giám khảo, hội đồng cố vấn cho các cuộc thi khoa học kỹ thuật, AI, Robotics từ cấp cơ sở đến quốc gia, quốc tế." },
          { key: "sukien.card4.title", label: "Thẻ 4 — Tiêu đề", type: "text", def: "Trưng bày & chung kết trao giải" },
          { key: "sukien.card4.text", label: "Thẻ 4 — Mô tả", type: "textarea", def: "Trưng bày sản phẩm dự thi, chấm giải và trao giải nhằm khích lệ tinh thần sáng tạo của học sinh." },
          { key: "sukien.note", label: "Ghi chú trong khung xanh cuối khối", type: "textarea", def: "Thông tin lịch cụ thể từng ngày hội/cuộc thi sẽ được cập nhật trong thời gian tới. Nếu trường bạn quan tâm tổ chức, hãy liên hệ VSIA để được tư vấn." },
        ],
      },
      {
        title: "Dải kêu gọi cuối trang",
        fields: [
          { key: "sukien.cta.title", label: "Tiêu đề", type: "text", def: "Trường bạn muốn tổ chức ngày hội hoặc cuộc thi STEM?" },
          { key: "sukien.cta.text", label: "Mô tả", type: "textarea", def: "VSIA đồng hành tư vấn chuyên môn, tổ chức và điều phối — từ cấp cơ sở đến cấp quốc gia, quốc tế." },
          { key: "sukien.cta.button", label: "Chữ trên nút", type: "text", def: "Đăng ký tổ chức tại trường" },
        ],
      },
    ],
  },
  "lab": {
    label: "Thiết kế và chuyển giao chương trình giáo dục",
    sections: [
      {
        title: "Đầu trang — 3 thẻ nhỏ và nút thứ hai",
        note: "Badge, tiêu đề và nút chính sửa ở phần \"Giao diện đầu trang\" phía trên.",
        fields: [
          { key: "lab.hero.badge1", label: "Thẻ nhỏ 1", type: "text", def: "Khảo sát đến vận hành trọn gói" },
          { key: "lab.hero.badge2", label: "Thẻ nhỏ 2", type: "text", def: "Phù hợp ngân sách & cấp học" },
          { key: "lab.hero.badge3", label: "Thẻ nhỏ 3", type: "text", def: "Đồng hành lâu dài sau bàn giao" },
          { key: "lab.hero.cta2.label", label: "Nút thứ hai — Chữ", type: "text", def: "Xem dịch vụ" },
          { key: "lab.hero.cta2.link", label: "Nút thứ hai — Link", type: "link", def: "#dich-vu" },
        ],
      },
      {
        title: "Khối Dịch vụ bao gồm — 6 thẻ",
        fields: [
          { key: "lab.services.title", label: "Tiêu đề khối", type: "text", def: "DỊCH VỤ BAO GỒM" },
          { key: "lab.services.subtitle", label: "Mô tả khối", type: "textarea", def: "Cung cấp giải pháp toàn diện từ thiết kế không gian vật lý đến khung chương trình học liệu cho các nhà trường và đối tác doanh nghiệp, địa phương." },
          { key: "lab.svc1.title", label: "Thẻ 1 — Tiêu đề", type: "text", def: "Khảo sát & đánh giá không gian" },
          { key: "lab.svc1.text", label: "Thẻ 1 — Mô tả", type: "textarea", def: "Khảo sát thực tế phòng học, diện tích, hệ thống điện, an toàn để đưa ra phương án bố trí phù hợp." },
          { key: "lab.svc2.title", label: "Thẻ 2 — Tiêu đề", type: "text", def: "Thiết kế bố trí phòng Lab" },
          { key: "lab.svc2.text", label: "Thẻ 2 — Mô tả", type: "textarea", def: "Đề xuất sơ đồ bố trí bàn ghế, khu vực thực hành, khu trưng bày sản phẩm theo từng cấp học." },
          { key: "lab.svc3.title", label: "Thẻ 3 — Tiêu đề", type: "text", def: "Danh mục thiết bị" },
          { key: "lab.svc3.text", label: "Thẻ 3 — Mô tả", type: "textarea", def: "Tư vấn danh mục thiết bị STEM/Robotics phù hợp mục tiêu giảng dạy và ngân sách nhà trường." },
          { key: "lab.svc4.title", label: "Thẻ 4 — Tiêu đề", type: "text", def: "Triển khai & lắp đặt" },
          { key: "lab.svc4.text", label: "Thẻ 4 — Mô tả", type: "textarea", def: "Hỗ trợ giám sát thi công, lắp đặt thiết bị, đảm bảo đúng thiết kế đã thống nhất." },
          { key: "lab.svc5.title", label: "Thẻ 5 — Tiêu đề", type: "text", def: "Đào tạo sử dụng" },
          { key: "lab.svc5.text", label: "Thẻ 5 — Mô tả", type: "textarea", def: "Tập huấn giáo viên sử dụng, bảo quản thiết bị và khai thác phòng Lab hiệu quả sau bàn giao." },
          { key: "lab.svc6.title", label: "Thẻ 6 — Tiêu đề", type: "text", def: "Hỗ trợ vận hành" },
          { key: "lab.svc6.text", label: "Thẻ 6 — Mô tả", type: "textarea", def: "Đồng hành lâu dài, tư vấn nâng cấp và giải đáp trong quá trình vận hành phòng Lab." },
        ],
      },
      {
        title: "Khối Lộ trình tư vấn — 6 bước",
        fields: [
          { key: "lab.path.title", label: "Tiêu đề khối", type: "text", def: "LỘ TRÌNH TƯ VẤN XÂY DỰNG PHÒNG THỰC HÀNH STEM" },
          { key: "lab.path.subtitle", label: "Mô tả khối", type: "textarea", def: "6 bước đồng hành cùng nhà trường, từ khảo sát đến vận hành và kết nối lâu dài." },
          { key: "lab.step1.title", label: "Bước 1 — Tiêu đề", type: "text", def: "Khảo sát thực tế" },
          { key: "lab.step1.text", label: "Bước 1 — Mô tả", type: "textarea", def: "Thông tin mặt bằng, tình hình thực tế của nhà trường, đơn vị." },
          { key: "lab.step2.title", label: "Bước 2 — Tiêu đề", type: "text", def: "Tư vấn mô hình phòng STEM phù hợp" },
          { key: "lab.step2.text", label: "Bước 2 — Mô tả", type: "textarea", def: "Danh mục thiết bị, thiết kế và bố trí không gian." },
          { key: "lab.step3.title", label: "Bước 3 — Tiêu đề", type: "text", def: "Đồng hành thi công" },
          { key: "lab.step3.text", label: "Bước 3 — Mô tả", type: "textarea", def: "Theo sát tiến độ, chất lượng thi công; phối hợp nghiệm thu hạng mục hoàn thiện." },
          { key: "lab.step4.title", label: "Bước 4 — Tiêu đề", type: "text", def: "Tập huấn, đào tạo" },
          { key: "lab.step4.text", label: "Bước 4 — Mô tả", type: "textarea", def: "Hướng dẫn sử dụng thiết bị; chương trình giáo dục STEM bám sát CT GDPT, khai thác hiệu quả thiết bị của phòng." },
          { key: "lab.step5.title", label: "Bước 5 — Tiêu đề", type: "text", def: "Chuyển giao quy trình vận hành" },
          { key: "lab.step5.text", label: "Bước 5 — Mô tả", type: "textarea", def: "Tư vấn và xây dựng quy trình vận hành, quản lý, kiểm tra và đánh giá phòng STEM." },
          { key: "lab.step6.title", label: "Bước 6 — Tiêu đề", type: "text", def: "Đồng hành và kết nối" },
          { key: "lab.step6.text", label: "Bước 6 — Mô tả", type: "textarea", def: "Hỗ trợ vận hành; kết nối các cuộc thi trong nước và chương trình quốc tế." },
        ],
      },
      {
        title: "Dải kêu gọi cuối trang",
        fields: [
          { key: "lab.cta.title", label: "Tiêu đề", type: "text", def: "Nhà trường bạn muốn xây dựng phòng thực hành STEM?" },
          { key: "lab.cta.text", label: "Mô tả", type: "textarea", def: "VSIA đồng hành từ khảo sát, thiết kế đến vận hành phòng Lab đạt chuẩn, phù hợp ngân sách và cấp học." },
          { key: "lab.cta.button", label: "Chữ trên nút", type: "text", def: "Liên hệ tư vấn thiết kế" },
        ],
      },
    ],
  },
  "hop-tac": {
    label: "Hợp tác",
    sections: [
      {
        title: "Đầu trang",
        note: "Trang này có phần đầu trang riêng, KHÔNG lấy từ form \"Giao diện đầu trang\" phía trên. Sửa tại đây.",
        fields: [
          { key: "lienhe.hero.badge", label: "Badge nhỏ phía trên tiêu đề", type: "text", def: "KẾT NỐI VỚI VSIA" },
          { key: "lienhe.hero.title", label: "Tiêu đề lớn", type: "text", def: "Liên hệ với chúng tôi" },
          { key: "lienhe.hero.lead", label: "Mô tả ngắn", type: "textarea", def: "VSIA luôn sẵn sàng lắng nghe và đồng hành cùng nhà trường, giáo viên\\ntrên hành trình giáo dục STEM." },
          { key: "lienhe.hero.cta1.label", label: "Nút 1 — Chữ", type: "text", def: "Đăng ký tư vấn" },
          { key: "lienhe.hero.cta1.link", label: "Nút 1 — Link", type: "link", def: "#dang-ky-tu-van" },
          { key: "lienhe.hero.cta2.label", label: "Nút 2 — Chữ", type: "text", def: "Xem thông tin liên hệ" },
          { key: "lienhe.hero.cta2.link", label: "Nút 2 — Link", type: "link", def: "#thong-tin-lien-he" },
          { key: "lienhe.hero.badge1", label: "Thẻ nhỏ 1", type: "text", def: "Tư vấn miễn phí buổi đầu" },
          { key: "lienhe.hero.badge2", label: "Thẻ nhỏ 2", type: "text", def: "Đồng hành cùng nhà trường toàn quốc" },
          { key: "lienhe.hero.badge3", label: "Thẻ nhỏ 3", type: "text", def: "Phản hồi nhanh chóng" },
        ],
      },
      {
        title: "Khối Thông tin liên hệ",
        note: "Đây là thông tin hiện ở thân trang Hợp tác. Thông tin ở chân trang (footer) sửa riêng trong mục Trang chủ.",
        fields: [
          { key: "lienhe.info.eyebrow", label: "Nhãn nhỏ phía trên", type: "text", def: "Thông tin liên hệ" },
          { key: "lienhe.info.company", label: "Tên công ty", type: "text", def: "Công ty TNHH Học viện Đổi mới Sáng tạo STEM Việt Nam" },
          { key: "lienhe.info.address.label", label: "Trụ sở — Nhãn", type: "text", def: "TRỤ SỞ" },
          { key: "lienhe.info.address.value", label: "Trụ sở — Địa chỉ", type: "textarea", def: "Số 23, Ngõ 9, Xóm Trung Thanh, Thôn Hữu Từ,\\nXã Đại Thanh, Thành phố Hà Nội" },
          { key: "lienhe.info.address.link", label: "Trụ sở — Link bản đồ", type: "link", def: "https://www.google.com/maps/search/?api=1&query=S%E1%BB%91+23%2C+Ng%C3%B5+9%2C+X%C3%B3m+Trung+Thanh%2C+Th%C3%B4n+H%E1%BB%AFu+T%E1%BB%AB%2C+X%C3%A3+%C4%90%E1%BA%A1i+Thanh%2C+H%C3%A0+N%E1%BB%99i" },
          { key: "lienhe.info.phone.label", label: "Hotline — Nhãn", type: "text", def: "HOTLINE" },
          { key: "lienhe.info.phone.value", label: "Hotline — Số hiển thị", type: "text", def: "0862.26.05.26" },
          { key: "lienhe.info.phone.link", label: "Hotline — Link (Zalo)", type: "link", def: "https://zalo.me/0862260526" },
          { key: "lienhe.info.email.label", label: "Email — Nhãn", type: "text", def: "EMAIL" },
          { key: "lienhe.info.email.value", label: "Email — Địa chỉ hiển thị", type: "text", def: "info@vsia.edu.vn" },
          { key: "lienhe.info.email.link", label: "Email — Link", type: "link", def: "https://mail.google.com/mail/u/0/?fs=1&to=info%40vsia.edu.vn&tf=cm" },
          { key: "lienhe.info.web.label", label: "Website — Nhãn", type: "text", def: "WEBSITE" },
          { key: "lienhe.info.web.value", label: "Website — Địa chỉ hiển thị", type: "text", def: "www.vsia.edu.vn" },
          { key: "lienhe.info.web.link", label: "Website — Link", type: "link", def: "https://www.vsia.edu.vn" },
          { key: "lienhe.info.profileButton", label: "Chữ trên nút tải hồ sơ năng lực", type: "text", def: "Tải Hồ sơ năng lực" },
        ],
      },
      {
        title: "Form Gửi yêu cầu tư vấn (trên trang này)",
        note: "Khác với form bật lên khi bấm nút phong bì — form đó sửa trong mục Trang chủ.",
        fields: [
          { key: "lienhe.form.title", label: "Tiêu đề form", type: "text", def: "Gửi yêu cầu tư vấn" },
          { key: "lienhe.form.note", label: "Ghi chú dưới tiêu đề", type: "text", def: "Các trường có dấu * là bắt buộc." },
          { key: "lienhe.form.name.label", label: "Ô Họ và tên — Nhãn", type: "text", def: "Họ và tên *" },
          { key: "lienhe.form.name.placeholder", label: "Ô Họ và tên — Gợi ý", type: "text", def: "Nguyễn Văn A" },
          { key: "lienhe.form.org.label", label: "Ô Đơn vị — Nhãn", type: "text", def: "Đơn vị *" },
          { key: "lienhe.form.org.placeholder", label: "Ô Đơn vị — Gợi ý", type: "text", def: "Trường / Sở / Doanh nghiệp" },
          { key: "lienhe.form.role.label", label: "Ô Vai trò — Nhãn", type: "text", def: "Vai trò" },
          { key: "lienhe.form.role.option0", label: "Vai trò — Dòng chọn mặc định", type: "text", def: "– Chọn vai trò –" },
          { key: "lienhe.form.role.option1", label: "Vai trò — Lựa chọn 1", type: "text", def: "Giáo viên" },
          { key: "lienhe.form.role.option2", label: "Vai trò — Lựa chọn 2", type: "text", def: "Cán bộ quản lý" },
          { key: "lienhe.form.role.option3", label: "Vai trò — Lựa chọn 3", type: "text", def: "Doanh nghiệp" },
          { key: "lienhe.form.role.option4", label: "Vai trò — Lựa chọn 4", type: "text", def: "Đối tác giáo dục" },
          { key: "lienhe.form.city.label", label: "Ô Tỉnh/Thành phố — Nhãn", type: "text", def: "Tỉnh / Thành phố" },
          { key: "lienhe.form.city.placeholder", label: "Ô Tỉnh/Thành phố — Gợi ý", type: "text", def: "Hà Nội" },
          { key: "lienhe.form.phone.label", label: "Ô Số điện thoại — Nhãn", type: "text", def: "Số điện thoại *" },
          { key: "lienhe.form.phone.placeholder", label: "Ô Số điện thoại — Gợi ý", type: "text", def: "0912 345 678" },
          { key: "lienhe.form.email.label", label: "Ô Email — Nhãn", type: "text", def: "Email" },
          { key: "lienhe.form.email.placeholder", label: "Ô Email — Gợi ý", type: "text", def: "ten@email.com" },
          { key: "lienhe.form.message.label", label: "Ô Nội dung — Nhãn", type: "text", def: "Nội dung cần tư vấn" },
          { key: "lienhe.form.message.placeholder", label: "Ô Nội dung — Gợi ý", type: "text", def: "Mô tả ngắn nhu cầu của đơn vị (phòng Lab, chương trình, ngày hội, hợp tác...)" },
          { key: "lienhe.form.submit", label: "Chữ trên nút gửi", type: "text", def: "Gửi yêu cầu" },
          { key: "lienhe.form.footnote1", label: "Ghi chú cuối — vế đầu", type: "text", def: "Thông tin của bạn sẽ được gửi tới" },
          { key: "lienhe.form.footnoteEmail", label: "Ghi chú cuối — email in đậm", type: "text", def: "info@vsia.edu.vn" },
          { key: "lienhe.form.footnote2", label: "Ghi chú cuối — vế sau", type: "text", def: "VSIA sẽ liên hệ sớm nhất." },
        ],
      },
      {
        title: "Khối Hình thức hợp tác — 4 thẻ",
        note: "Nút \"LIÊN HỆ\" dùng chung cho cả 4 thẻ: sửa một lần là cả 4 đổi theo.",
        fields: [
          { key: "lienhe.partner.eyebrow", label: "Nhãn nhỏ phía trên", type: "text", def: "Đồng hành cùng VSIA" },
          { key: "lienhe.partner.title", label: "Tiêu đề khối", type: "text", def: "Hình thức hợp tác" },
          { key: "lienhe.partner.lead", label: "Mô tả khối", type: "textarea", def: "Kết nối với VSIA qua những mô hình hợp tác phù hợp với nhu cầu của từng đơn vị." },
          { key: "lienhe.partner1.title", label: "Thẻ 1 — Tiêu đề", type: "text", def: "Hợp tác với Sở Giáo dục các địa phương và nhà trường" },
          { key: "lienhe.partner1.item1", label: "Thẻ 1 — Gạch đầu dòng 1", type: "text", def: "Tư vấn và chuyển giao chương trình" },
          { key: "lienhe.partner1.item2", label: "Thẻ 1 — Gạch đầu dòng 2", type: "text", def: "Tư vấn xây dựng phòng thực hành STEM, khu trải nghiệm STEM" },
          { key: "lienhe.partner1.item3", label: "Thẻ 1 — Gạch đầu dòng 3", type: "text", def: "Đào tạo và tập huấn giáo viên" },
          { key: "lienhe.partner2.title", label: "Thẻ 2 — Tiêu đề", type: "text", def: "Hợp tác với các Trung tâm Giáo dục và Tổ chức Giáo dục Tư nhân" },
          { key: "lienhe.partner2.item1", label: "Thẻ 2 — Gạch đầu dòng 1", type: "text", def: "Mô hình nhượng quyền chương trình (Franchise)" },
          { key: "lienhe.partner2.item2", label: "Thẻ 2 — Gạch đầu dòng 2", type: "text", def: "Đồng thương hiệu (Co-branding)" },
          { key: "lienhe.partner3.title", label: "Thẻ 3 — Tiêu đề", type: "text", def: "Hợp tác với các Doanh nghiệp" },
          { key: "lienhe.partner3.item1", label: "Thẻ 3 — Gạch đầu dòng 1", type: "text", def: "Tích hợp giải pháp" },
          { key: "lienhe.partner3.item2", label: "Thẻ 3 — Gạch đầu dòng 2", type: "text", def: "Hợp tác truyền thông trong việc phân phối học liệu, thiết bị" },
          { key: "lienhe.partner4.title", label: "Thẻ 4 — Tiêu đề", type: "text", def: "Hợp tác tổ chức các Ngày hội, Giải đấu và Sự kiện STEM, AI, Robotics" },
          { key: "lienhe.partner4.item1", label: "Thẻ 4 — Gạch đầu dòng 1", type: "text", def: "Hội thảo và Diễn đàn" },
          { key: "lienhe.partner4.item2", label: "Thẻ 4 — Gạch đầu dòng 2", type: "text", def: "Các cuộc thi STEM, giải đấu Robotics" },
          { key: "lienhe.partner.buttonLabel", label: "Nút của cả 4 thẻ — Chữ", type: "text", def: "LIÊN HỆ" },
          { key: "lienhe.partner.buttonLink", label: "Nút của cả 4 thẻ — Link", type: "link", def: "#thong-tin-lien-he" },
        ],
      },
    ],
  },
  "khoa-hoc": {
    label: "Khóa học",
    sections: [
      {
        title: "Đầu trang",
        note: "Trang Khoá học có phần đầu trang riêng, không lấy từ form \"Giao diện đầu trang\".",
        fields: [
          { key: "khoahoc.hero.badge", label: "Badge nhỏ phía trên tiêu đề", type: "text", def: "Chương trình đào tạo VSIA" },
          { key: "khoahoc.hero.title", label: "Tiêu đề lớn", type: "text", def: "Đào tạo và bồi dưỡng chuyên môn STEM" },
          { key: "khoahoc.hero.lead", label: "Mô tả ngắn", type: "textarea", def: "Tổ chức các khóa đào tạo, bồi dưỡng nâng cao năng lực sư phạm và làm chủ công nghệ cho đội ngũ cán bộ quản lý, giáo viên các cấp." },
          { key: "khoahoc.hero.cta1.label", label: "Nút 1 — Chữ", type: "text", def: "Xem lộ trình đào tạo" },
          { key: "khoahoc.hero.cta1.link", label: "Nút 1 — Link", type: "link", def: "#lo-trinh" },
          { key: "khoahoc.hero.cta2.label", label: "Nút 2 — Chữ (mở form tư vấn)", type: "text", def: "Đăng ký tư vấn" },
          { key: "khoahoc.hero.badge1", label: "Thẻ nhỏ 1", type: "text", def: "Bám sát Chương trình GDPT 2018" },
          { key: "khoahoc.hero.badge2", label: "Thẻ nhỏ 2", type: "text", def: "Cơ bản đến chuyên sâu" },
          { key: "khoahoc.hero.badge3", label: "Thẻ nhỏ 3", type: "text", def: "Đồng hành cùng Hội đồng Chuyên gia VSIA" },
        ],
      },
      {
        title: "Khối danh sách khoá học",
        note: "Thêm, sửa, xoá khoá học ở mục Khóa học trong nhóm quản lý dữ liệu.",
        fields: [
          { key: "khoahoc.list.title", label: "Tiêu đề khối", type: "text", def: "KHOÁ HỌC" },
          { key: "khoahoc.list.subtitle", label: "Mô tả khối", type: "textarea", def: "Danh sách các khoá đào tạo, tập huấn STEM hiện có tại VSIA." },
          { key: "khoahoc.list.empty1", label: "Khi chưa có khoá học — vế đầu", type: "text", def: "Chưa có khoá học nào. Chạy" },
          { key: "khoahoc.list.empty2", label: "Khi chưa có khoá học — vế sau", type: "text", def: "để thêm dữ liệu mẫu." },
        ],
      },
      {
        title: "Khối Video & bài giảng mẫu",
        note: "Chỉ hiện khi đã có video. Thêm video ở mục Video khoá học.",
        fields: [
          { key: "khoahoc.video.title", label: "Tiêu đề khối", type: "text", def: "VIDEO & BÀI GIẢNG MẪU" },
          { key: "khoahoc.video.subtitle", label: "Mô tả khối", type: "textarea", def: "Tài nguyên tham khảo dành cho giáo viên đang triển khai chương trình STEM tại trường." },
        ],
      },
    ],
  },
  "tin-tuc": {
    label: "Tin tức",
    sections: [
      {
        title: "Đầu trang và các tiêu đề",
        note: "Bài viết thêm, sửa, xoá ở mục Bài viết & Tin tức.",
        fields: [
          { key: "tintuc.eyebrow", label: "Nhãn nhỏ phía trên", type: "text", def: "— VSIA" },
          { key: "tintuc.title", label: "Tiêu đề lớn", type: "text", def: "Tin tức & Bài viết" },
          { key: "tintuc.lead", label: "Mô tả ngắn", type: "textarea", def: "Cập nhật hoạt động, sự kiện và câu chuyện giáo dục STEM từ VSIA cùng các đối tác đồng hành." },
          { key: "tintuc.domestic.title", label: "Tiêu đề khối tin trong nước", type: "text", def: "TIN TỨC TRONG NƯỚC" },
          { key: "tintuc.international.title", label: "Tiêu đề khối tin quốc tế", type: "text", def: "TIN TỨC QUỐC TẾ" },
          { key: "tintuc.sidebar.title", label: "Tiêu đề cột bên phải", type: "text", def: "Nổi bật" },
          { key: "tintuc.readMore", label: "Chữ link bài nổi bật", type: "text", def: "Đọc bài viết" },
          { key: "tintuc.seeMore", label: "Chữ link các bài còn lại", type: "text", def: "Xem thêm" },
          { key: "tintuc.empty", label: "Khi chưa có bài viết nào", type: "text", def: "Chưa có bài viết nào." },
        ],
      },
    ],
  },
};

// Tra cứu nhanh theo khoá: dùng để kiểm tra khoá hợp lệ khi lưu, và để lấy giá trị mặc định.
const FIELD_BY_KEY = {};
Object.values(CONTENT_SECTIONS).forEach((page) => {
  page.sections.forEach((section) => {
    section.fields.forEach((field) => { FIELD_BY_KEY[field.key] = field; });
  });
});

module.exports = { CONTENT_SECTIONS, FIELD_BY_KEY };
