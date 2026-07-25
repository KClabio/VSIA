const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  group: { type: String, enum: ['leadership', 'expert'], default: 'expert' },
  bio: { type: String, default: null, trim: true },
  highlight: { type: String, default: null, trim: true },
  achievements: [{ type: String, trim: true }],
  photo: { type: String, default: null },
  order: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('TeamMember', teamMemberSchema);
