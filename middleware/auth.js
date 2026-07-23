const User = require('../models/User');

async function loadUser(req, res, next) {
  if (req.session.userId) {
    req.user = await User.findById(req.session.userId).lean();
  }
  res.locals.user = req.user || null;
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.redirect(`/dang-nhap?redirect=${encodeURIComponent(req.originalUrl)}`);
  }
  next();
}

module.exports = { loadUser, requireAuth };
