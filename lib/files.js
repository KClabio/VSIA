const fs = require('fs');
const path = require('path');

const CLOUDINARY_URL_RE = /res\.cloudinary\.com\/[^/]+\/(image|video|raw)\/upload\/(?:v\d+\/)?([^.]+)\./;

function unlinkUploaded(fileRef) {
  if (!fileRef) return;

  const cloudinaryMatch = fileRef.match(CLOUDINARY_URL_RE);
  if (cloudinaryMatch) {
    const [, resourceType, publicId] = cloudinaryMatch;
    try {
      const { cloudinary } = require('../middleware/upload');
      if (cloudinary) cloudinary.uploader.destroy(publicId, { resource_type: resourceType }).catch(() => {});
    } catch {
      // Không chặn luồng chính nếu xoá trên Cloudinary thất bại — chỉ để lại file mồ côi.
    }
    return;
  }

  fs.unlink(path.join(__dirname, '..', 'public', fileRef), () => {});
}

module.exports = { unlinkUploaded };
