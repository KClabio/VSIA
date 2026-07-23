const fs = require('fs');
const path = require('path');

function unlinkUploaded(relativePath) {
  if (!relativePath) return;
  fs.unlink(path.join(__dirname, '..', 'public', relativePath), () => {});
}

module.exports = { unlinkUploaded };
