const ROLES = ['hocvien', 'giaovien', 'bien_tap', 'cskh', 'admin'];

const ROLE_LABELS = {
  hocvien: 'Học viên',
  giaovien: 'Giáo viên',
  bien_tap: 'Biên tập viên',
  cskh: 'Tư vấn viên',
  admin: 'Quản trị viên',
};

// hocvien không được vào /admin
const STAFF_ROLES = ['giaovien', 'bien_tap', 'cskh', 'admin'];

const MODULE_ROLES = {
  dashboard: ['admin', 'giaovien', 'bien_tap', 'cskh'],
  'khoa-hoc': ['admin', 'giaovien'],
  'tien-do': ['admin', 'giaovien'],
  'thu-vien': ['admin', 'bien_tap'],
  'video-khoa-hoc': ['admin', 'bien_tap'],
  'hoi-thao': ['admin', 'bien_tap'],
  'bai-viet': ['admin', 'bien_tap'],
  'doi-ngu': ['admin', 'bien_tap'],
  'doi-tac': ['admin', 'bien_tap'],
  'nguoi-dung': ['admin'],
  'lien-he': ['admin', 'cskh'],
  'cai-dat': ['admin'],
};

// Mọi role staff giờ có dashboard cá nhân hoá riêng ở /admin.
const ROLE_HOME = {
  admin: '/admin',
  giaovien: '/admin',
  bien_tap: '/admin',
  cskh: '/admin',
};

module.exports = { ROLES, ROLE_LABELS, STAFF_ROLES, MODULE_ROLES, ROLE_HOME };
