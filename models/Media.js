const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  type: { type: String, enum: ['image', 'video'], required: true },
  filePath: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Media', mediaSchema);
