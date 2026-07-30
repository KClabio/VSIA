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
  instructor: { type: String, default: '' },
  instructorUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  studyPeriod: { type: String, default: '' },
  examDate: { type: String, default: '' },
  materials: [{
    name: { type: String, required: true },
    filePath: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  }],
  modules: [{
    title: { type: String, required: true, trim: true },
    weekStart: { type: String, default: '' },
    weekEnd: { type: String, default: '' },
    chapterTitle: { type: String, default: '' },
    topics: [{ type: String }],
    lessons: [{
      title: { type: String, required: true, trim: true },
      type: { type: String, enum: ['video', 'document', 'quiz', 'forum', 'qa'], default: 'video' },
      category: { type: String, enum: ['lecture', 'interaction', 'practice', 'exam'], default: 'lecture' },
      videoUrl: { type: String, default: null },
      videoFile: { type: String, default: null },
      content: { type: String, default: '' },
    }],
  }],
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
