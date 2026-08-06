const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Nếu có đủ 3 biến Cloudinary trong .env thì dùng cloud storage (bắt buộc khi deploy lên nền
// tảng ổ đĩa tạm thời — Render/Railway/Heroku/Vercel...). Không có thì rơi về lưu đĩa cục bộ
// như trước (đủ dùng cho dev local hoặc VPS có ổ đĩa cố định).
const useCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

let cloudinary = null;
let CloudinaryStorage = null;
if (useCloudinary) {
  cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  ({ CloudinaryStorage } = require('multer-storage-cloudinary'));
}

function makeStorage(subfolder, resourceType) {
  if (useCloudinary) {
    return new CloudinaryStorage({
      cloudinary,
      params: () => ({
        folder: `vsia/${subfolder}`,
        resource_type: resourceType,
        public_id: crypto.randomUUID(),
      }),
    });
  }
  return multer.diskStorage({
    destination: path.join(__dirname, '..', 'public', 'uploads', subfolder),
    filename: (req, file, cb) => {
      const uniqueName = crypto.randomUUID() + path.extname(file.originalname).toLowerCase();
      cb(null, uniqueName);
    },
  });
}

// Trả về đường dẫn/URL để lưu vào DB, đúng theo storage đang dùng: URL Cloudinary đầy đủ
// (req.file.path) hoặc đường dẫn tương đối /uploads/... như trước.
function fileUrl(file, subfolder) {
  if (!file) return null;
  return useCloudinary ? file.path : `/uploads/${subfolder}/${file.filename}`;
}

function fileFilterFor(allowedExtensions) {
  return (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return cb(new Error(`Định dạng file không được hỗ trợ: ${ext}`));
    }
    cb(null, true);
  };
}

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg'];
const DOCUMENT_EXTENSIONS = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.zip'];

// Gói Cloudinary free chỉ nhận ảnh tối đa 10MB/file — khớp giới hạn multer với giới hạn thật của
// Cloudinary khi đang dùng cloud storage, để người dùng thấy thông báo "quá dung lượng" thân
// thiện (friendlyUploadError) thay vì lỗi thô từ Cloudinary API.
const IMAGE_SIZE_LIMIT = useCloudinary ? 10 * 1024 * 1024 : 20 * 1024 * 1024;

const uploadImage = multer({
  storage: makeStorage('images', 'image'),
  limits: { fileSize: IMAGE_SIZE_LIMIT },
  fileFilter: fileFilterFor(IMAGE_EXTENSIONS),
});

const uploadVideo = multer({
  storage: makeStorage('videos', 'video'),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: fileFilterFor(VIDEO_EXTENSIONS),
});

const uploadDocuments = multer({
  storage: makeStorage('documents', 'raw'),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: fileFilterFor(DOCUMENT_EXTENSIONS),
});

function friendlyUploadError(err) {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    const imageMax = useCloudinary ? '10MB' : '20MB';
    return `File quá dung lượng cho phép. Ảnh tối đa ${imageMax}, video tối đa 100MB, tài liệu tối đa 20MB.`;
  }
  return err ? err.message : 'Đã có lỗi xảy ra khi tải file lên.';
}

const FIELD_CONFIG = {
  image: { subfolder: 'images', resourceType: 'image', extensions: IMAGE_EXTENSIONS },
  materials: { subfolder: 'documents', resourceType: 'raw', extensions: DOCUMENT_EXTENSIONS },
};

const courseFilesStorage = useCloudinary
  ? new CloudinaryStorage({
      cloudinary,
      params: (req, file) => {
        const config = FIELD_CONFIG[file.fieldname];
        return { folder: `vsia/${config.subfolder}`, resource_type: config.resourceType, public_id: crypto.randomUUID() };
      },
    })
  : multer.diskStorage({
      destination: (req, file, cb) => {
        const config = FIELD_CONFIG[file.fieldname];
        cb(null, path.join(__dirname, '..', 'public', 'uploads', config.subfolder));
      },
      filename: (req, file, cb) => {
        cb(null, crypto.randomUUID() + path.extname(file.originalname).toLowerCase());
      },
    });

const uploadCourseFiles = multer({
  storage: courseFilesStorage,
  limits: { fileSize: IMAGE_SIZE_LIMIT },
  fileFilter: (req, file, cb) => {
    const config = FIELD_CONFIG[file.fieldname];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!config || !config.extensions.includes(ext)) {
      return cb(new Error(`Định dạng file không được hỗ trợ: ${ext}`));
    }
    cb(null, true);
  },
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'materials', maxCount: 10 },
]);

const LESSON_FIELD_CONFIG = {
  videoFile: { subfolder: 'videos', resourceType: 'video', extensions: VIDEO_EXTENSIONS },
  documentFile: { subfolder: 'documents', resourceType: 'raw', extensions: DOCUMENT_EXTENSIONS },
};

const lessonFilesStorage = useCloudinary
  ? new CloudinaryStorage({
      cloudinary,
      params: (req, file) => {
        const config = LESSON_FIELD_CONFIG[file.fieldname];
        return { folder: `vsia/${config.subfolder}`, resource_type: config.resourceType, public_id: crypto.randomUUID() };
      },
    })
  : multer.diskStorage({
      destination: (req, file, cb) => {
        const config = LESSON_FIELD_CONFIG[file.fieldname];
        cb(null, path.join(__dirname, '..', 'public', 'uploads', config.subfolder));
      },
      filename: (req, file, cb) => {
        cb(null, crypto.randomUUID() + path.extname(file.originalname).toLowerCase());
      },
    });

const uploadLessonFiles = multer({
  storage: lessonFilesStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const config = LESSON_FIELD_CONFIG[file.fieldname];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!config || !config.extensions.includes(ext)) {
      return cb(new Error(`Định dạng file không được hỗ trợ: ${ext}`));
    }
    cb(null, true);
  },
}).fields([
  { name: 'videoFile', maxCount: 1 },
  { name: 'documentFile', maxCount: 1 },
]);

// Bọc middleware upload (multer) + handler async: multer gọi callback nội bộ, không qua cơ
// chế route-dispatch của Express, nên Express 5 không tự bắt được promise reject bên trong
// callback đó. Bọc thủ công ở đây để mọi lỗi (validation Mongoose, lỗi DB...) đều được forward
// qua next(err) tới global error handler thay vì trở thành unhandled rejection (treo/crash server).
function wrapUpload(uploader, handler) {
  return (req, res, next) => {
    uploader(req, res, (err) => {
      Promise.resolve(handler(err, req, res)).catch(next);
    });
  };
}

module.exports = {
  uploadImage,
  uploadVideo,
  uploadDocuments,
  uploadCourseFiles,
  uploadLessonFiles,
  friendlyUploadError,
  wrapUpload,
  fileUrl,
  useCloudinary,
  cloudinary,
};
