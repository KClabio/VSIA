const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

function makeStorage(subfolder) {
  return multer.diskStorage({
    destination: path.join(__dirname, '..', 'public', 'uploads', subfolder),
    filename: (req, file, cb) => {
      const uniqueName = crypto.randomUUID() + path.extname(file.originalname).toLowerCase();
      cb(null, uniqueName);
    },
  });
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

const uploadImage = multer({
  storage: makeStorage('images'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilterFor(IMAGE_EXTENSIONS),
});

const uploadVideo = multer({
  storage: makeStorage('videos'),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: fileFilterFor(VIDEO_EXTENSIONS),
});

const uploadDocuments = multer({
  storage: makeStorage('documents'),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: fileFilterFor(DOCUMENT_EXTENSIONS),
});

const FIELD_CONFIG = {
  image: { subfolder: 'images', extensions: IMAGE_EXTENSIONS },
  materials: { subfolder: 'documents', extensions: DOCUMENT_EXTENSIONS },
};

const courseFilesStorage = multer.diskStorage({
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
  limits: { fileSize: 20 * 1024 * 1024 },
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

module.exports = { uploadImage, uploadVideo, uploadDocuments, uploadCourseFiles };
