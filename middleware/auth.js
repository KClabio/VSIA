const User = require('../models/User');
const { ROLES, ROLE_LABELS, STAFF_ROLES, MODULE_ROLES, ROLE_HOME } = require('../lib/roles');

async function loadUser(req, res, next) {
  if (req.session.userId) {
    req.user = await User.findById(req.session.userId).lean();
  }
  res.locals.user = req.user || null;
  res.locals.roleLabel = req.user ? ROLE_LABELS[req.user.role] : null;
  res.locals.ROLES = ROLES;
  res.locals.ROLE_LABELS = ROLE_LABELS;
  res.locals.ROLE_HOME = ROLE_HOME;
  res.locals.canAccessModule = (key) => !!req.user && (MODULE_ROLES[key] || []).includes(req.user.role);
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.redirect(`/dang-nhap?redirect=${encodeURIComponent(req.originalUrl)}`);
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).render('403');
  }
  next();
}

function requireStaff(req, res, next) {
  if (!req.user || !STAFF_ROLES.includes(req.user.role)) {
    return res.status(403).render('403');
  }
  next();
}

function requireModule(key) {
  const allowedRoles = MODULE_ROLES[key] || [];
  return function (req, res, next) {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).render('403');
    }
    next();
  };
}

module.exports = { loadUser, requireAuth, requireAdmin, requireStaff, requireModule };
