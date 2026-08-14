const mongoose = require('mongoose');

const webinarSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  tag: { type: String, default: '', trim: true },
  youtubeUrl: { type: String, required: true, trim: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Webinar', webinarSchema);
