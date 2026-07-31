const mongoose = require('mongoose');

const courseVideoSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  tag: { type: String, default: '', trim: true },
  videoUrl: { type: String, required: true },
  isExternal: { type: Boolean, default: false },
  featured: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('CourseVideo', courseVideoSchema);
