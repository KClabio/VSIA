const mongoose = require('mongoose');

const contactRequestSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  contact: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  status: { type: String, enum: ['moi', 'da_lien_he'], default: 'moi' },
}, { timestamps: true });

module.exports = mongoose.model('ContactRequest', contactRequestSchema);
