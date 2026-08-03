const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  summary: { type: String, required: true },
  content: { type: String, required: true },
  image: { type: String, default: null },
  category: { type: String, default: '', trim: true },
  sourceUrl: { type: String, default: null, trim: true },
  published: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Article', articleSchema);
