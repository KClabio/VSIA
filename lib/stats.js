const Course = require('../models/Course');
const Media = require('../models/Media');
const User = require('../models/User');

const clients = new Set();

async function computeStats() {
  const [courseCount, teacherCount, adminCount, mediaCount, courses] = await Promise.all([
    Course.countDocuments(),
    User.countDocuments({ role: 'giaovien' }),
    User.countDocuments({ role: 'admin' }),
    Media.countDocuments(),
    Course.find().select('materials rating').lean(),
  ]);

  const materialCount = courses.reduce((sum, c) => sum + (c.materials || []).length, 0);
  const avgRating = courses.length
    ? (courses.reduce((sum, c) => sum + (c.rating || 0), 0) / courses.length).toFixed(1)
    : '0.0';

  return { courseCount, teacherCount, adminCount, mediaCount, materialCount, avgRating };
}

function addClient(res) {
  clients.add(res);
}

function removeClient(res) {
  clients.delete(res);
}

async function broadcastStats() {
  if (clients.size === 0) return;
  const stats = await computeStats();
  const payload = `data: ${JSON.stringify(stats)}\n\n`;
  for (const res of clients) {
    res.write(payload);
  }
}

module.exports = { computeStats, addClient, removeClient, broadcastStats };
