const mongoose = require('mongoose');

const pageContentSchema = new mongoose.Schema({
  pageKey: { type: String, required: true, unique: true },
  heroBadge: { type: String, default: '' },
  heroTitleLine1: { type: String, default: '' },
  heroTitleLine2: { type: String, default: '' },
  heroSubtitle: { type: String, default: '' },
  heroCtaText: { type: String, default: '' },
  heroCtaLink: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('PageContent', pageContentSchema);
