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
      params: (req, file) => ({
        folder: `vsia/${subfolder}`,
        resource_type: resourceType,
        // File "raw" (tài liệu) trên Cloudinary không tự thêm đuôi mở rộng vào URL như ảnh/video —
        // phải tự gắn đuôi vào public_id, nếu không trình duyệt không nhận diện được định dạng
        // file (PDF...) và sẽ tải về thay vì xem trực tiếp.
        public_id: resourceType === 'raw'
          ? crypto.randomUUID() + path.extname(file.originalname).toLowerCase()
          : crypto.randomUUID(),
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

// Cloudinary mặc định chặn truy cập công khai (URL "res.cloudinary.com" bình thường) cho file
// "raw" (PDF/Word/PPT/Excel/ZIP) theo cài đặt bảo mật tài khoản (Settings > Security > Restricted
// media types) — đã thử ký URL kiểu sign_url thông thường nhưng KHÔNG bỏ qua được giới hạn này
// (đã kiểm chứng thực tế, vẫn trả 401). Cách duy nhất hoạt động là dùng endpoint API tải file có
// xác thực đầy đủ (api_key + timestamp + signature) của Cloudinary thay vì URL phân phối công
// khai — endpoint này không bị áp giới hạn "Restricted media types" vì đi qua API xác thực, không
// qua CDN phân phối công khai. Nhờ vậy tài liệu luôn mở được mà không cần admin vào đổi cài đặt
// Cloudinary thủ công.
function signRawUrl(url) {
  if (!useCloudinary || !url) return url;
  const match = url.match(/\/raw\/upload\/(?:v\d+\/)?(.+)$/);
  if (!match) return url;
  const publicId = match[1];
  const ext = path.extname(publicId).slice(1);
  try {
    return cloudinary.utils.private_download_url(publicId, ext, { resource_type: 'raw', type: 'upload' });
  } catch {
    return url;
  }
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
const IMAGE_SIZE_LIMIT = useCloudinary ? 10 * 1024 * 1024 : 50 * 1024 * 1024;

const uploadImage = multer({
  storage: makeStorage('images', 'image'),
  limits: { fileSize: IMAGE_SIZE_LIMIT },
  fileFilter: fileFilterFor(IMAGE_EXTENSIONS),
});

const uploadVideo = multer({
  storage: makeStorage('videos', 'video'),
  limits: { fileSize: 300 * 1024 * 1024 },
  fileFilter: fileFilterFor(VIDEO_EXTENSIONS),
});

const uploadDocuments = multer({
  storage: makeStorage('documents', 'raw'),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: fileFilterFor(DOCUMENT_EXTENSIONS),
});

function friendlyUploadError(err) {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    const imageMax = useCloudinary ? '10MB' : '50MB';
    return `File quá dung lượng cho phép. Ảnh tối đa ${imageMax}, video tối đa 300MB, tài liệu tối đa 100MB.`;
  }
  return err ? err.message : 'Đã có lỗi xảy ra khi tải file lên.';
}

const FIELD_CONFIG = {
  image: { subfolder: 'images', resourceType: 'image', extensions: IMAGE_EXTENSIONS },
  materials: { subfolder: 'documents', resourceType: 'raw', extensions: null },
};

const courseFilesStorage = useCloudinary
  ? new CloudinaryStorage({
      cloudinary,
      params: (req, file) => {
        const config = FIELD_CONFIG[file.fieldname];
        const publicId = config.resourceType === 'raw'
          ? crypto.randomUUID() + path.extname(file.originalname).toLowerCase()
          : crypto.randomUUID();
        return { folder: `vsia/${config.subfolder}`, resource_type: config.resourceType, public_id: publicId };
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
    if (!config) {
      return cb(new Error(`Trường file không hợp lệ: ${file.fieldname}`));
    }
    if (config.extensions && !config.extensions.includes(ext)) {
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
  documentFile: { subfolder: 'documents', resourceType: 'raw', extensions: null },
};

const lessonFilesStorage = useCloudinary
  ? new CloudinaryStorage({
      cloudinary,
      params: (req, file) => {
        const config = LESSON_FIELD_CONFIG[file.fieldname];
        const publicId = config.resourceType === 'raw'
          ? crypto.randomUUID() + path.extname(file.originalname).toLowerCase()
          : crypto.randomUUID();
        return { folder: `vsia/${config.subfolder}`, resource_type: config.resourceType, public_id: publicId };
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
    if (!config) {
      return cb(new Error(`Trường file không hợp lệ: ${file.fieldname}`));
    }
    if (config.extensions && !config.extensions.includes(ext)) {
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
  signRawUrl,
  useCloudinary,
  cloudinary,
};
