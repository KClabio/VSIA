const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { uploadImage, wrapUpload, fileUrl } = require('../middleware/upload');
const { unlinkUploaded } = require('../lib/files');
const { computeStats, broadcastStats } = require('../lib/stats');
const { checkAndConsume } = require('../lib/rateLimit');

router.get('/dang-ky', (req, res) => {
  if (req.user) return res.redirect('/');
  res.render('register', { error: null, form: {} });
});

router.post('/dang-ky', async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  const registerLimit = checkAndConsume(`register:ip:${req.ip}`, { minuteLimit: 3, dayLimit: 10 });
  if (!registerLimit.allowed) {
    return res.render('register', { error: `Bạn đã đăng ký quá nhiều lần, vui lòng thử lại sau ${registerLimit.retryAfterSeconds} giây.`, form: { name, email } });
  }

  if (!name || !email || !password) {
    return res.render('register', { error: 'Vui lòng điền đầy đủ thông tin.', form: { name, email } });
  }
  if (password !== confirmPassword) {
    return res.render('register', { error: 'Mật khẩu xác nhận không khớp.', form: { name, email } });
  }
  if (password.length < 6) {
    return res.render('register', { error: 'Mật khẩu phải có ít nhất 6 ký tự.', form: { name, email } });
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return res.render('register', { error: 'Email này đã được đăng ký.', form: { name, email } });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  let user;
  try {
    user = await User.create({ name, email, passwordHash });
  } catch (err) {
    if (err.code === 11000) {
      return res.render('register', { error: 'Email này đã được đăng ký.', form: { name, email } });
    }
    throw err;
  }
  await broadcastStats();

  req.session.userId = user._id;
  res.redirect('/');
});

router.get('/dang-nhap', (req, res) => {
  if (req.user) return res.redirect('/');
  res.render('login', { error: null, redirectTo: req.query.redirect || '/' });
});

router.post('/dang-nhap', async (req, res) => {
  const { email, password, redirectTo } = req.body;
  const normalizedEmail = (email || '').toLowerCase().trim();

  const loginLimit = checkAndConsume(`login:${normalizedEmail}`, { minuteLimit: 5, dayLimit: 20 });
  if (!loginLimit.allowed) {
    return res.render('login', { error: `Tài khoản tạm thời bị khoá do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ${loginLimit.retryAfterSeconds} giây.`, redirectTo: redirectTo || '/' });
  }

  const user = await User.findOne({ email: normalizedEmail });

  const valid = user && await bcrypt.compare(password || '', user.passwordHash);
  if (!valid) {
    return res.render('login', { error: 'Email hoặc mật khẩu không đúng.', redirectTo: redirectTo || '/' });
  }

  req.session.userId = user._id;
  res.redirect(redirectTo && redirectTo.startsWith('/') ? redirectTo : '/');
});

router.post('/dang-xuat', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

function profileViewData(req, stats, overrides) {
  return Object.assign({
    user: req.user,
    stats,
    error: null,
    passwordError: null,
    success: false,
    passwordSuccess: false,
  }, overrides);
}

router.get('/ho-so', requireAuth, async (req, res) => {
  const stats = req.user.role === 'admin' ? await computeStats() : null;
  res.render('profile', profileViewData(req, stats, {
    success: req.query.updated === '1',
    passwordSuccess: req.query.pwchanged === '1',
  }));
});

router.post('/ho-so', requireAuth, wrapUpload(uploadImage.single('avatar'), async (err, req, res) => {
  const stats = req.user.role === 'admin' ? await computeStats() : null;

  if (err) {
    return res.render('profile', profileViewData(req, stats, { error: err.message }));
  }

  const name = (req.body.name || '').trim();
  if (!name) {
    return res.render('profile', profileViewData(req, stats, { error: 'Họ tên không được để trống.' }));
  }

  const update = { name, phone: req.body.phone || '', bio: req.body.bio || '' };

  const currentUser = await User.findById(req.user._id);
  if (req.file) {
    unlinkUploaded(currentUser.avatar);
    update.avatar = fileUrl(req.file, 'images');
  }

  await User.findByIdAndUpdate(req.user._id, update);
  res.redirect('/ho-so?updated=1');
}));

router.post('/ho-so/mat-khau', requireAuth, async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  const stats = req.user.role === 'admin' ? await computeStats() : null;

  const fullUser = await User.findById(req.user._id);
  const valid = await bcrypt.compare(currentPassword || '', fullUser.passwordHash);

  if (!valid) {
    return res.render('profile', profileViewData(req, stats, { passwordError: 'Mật khẩu hiện tại không đúng.' }));
  }
  if (!newPassword || newPassword.length < 6) {
    return res.render('profile', profileViewData(req, stats, { passwordError: 'Mật khẩu mới phải có ít nhất 6 ký tự.' }));
  }
  if (newPassword !== confirmNewPassword) {
    return res.render('profile', profileViewData(req, stats, { passwordError: 'Mật khẩu mới xác nhận không khớp.' }));
  }

  fullUser.passwordHash = await bcrypt.hash(newPassword, 10);
  await fullUser.save();
  res.redirect('/ho-so?pwchanged=1');
});

module.exports = router;
