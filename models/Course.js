const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  provider: { type: String, default: 'VSIA' },
  category: { type: String, default: 'STEM' },
  isFree: { type: Boolean, default: true },
  price: { type: Number, default: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  image: { type: String, default: null },
  materials: [{
    name: { type: String, required: true },
    filePath: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
