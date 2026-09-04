const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const PendingRegistration = require('../models/PendingRegistration');
const { requireAuth } = require('../middleware/auth');
const { uploadImage, wrapUpload, fileUrl } = require('../middleware/upload');
const { unlinkUploaded } = require('../lib/files');
const { computeStats, broadcastStats } = require('../lib/stats');
const { checkAndConsume } = require('../lib/rateLimit');
const { sendMail } = require('../lib/mailer');

function generateCode() {
  return String(crypto.randomInt(100000, 1000000));
}

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

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    return res.render('register', { error: 'Email này đã được đăng ký.', form: { name, email } });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const code = generateCode();

  await PendingRegistration.findOneAndUpdate(
    { email: normalizedEmail },
    { name, email: normalizedEmail, passwordHash, code, attempts: 0, createdAt: new Date() },
    { upsert: true, setDefaultsOnInsert: true },
  );

  await sendMail({
    to: normalizedEmail,
    subject: 'Mã xác nhận đăng ký VSIA',
    html: `<p>Xin chào ${name},</p><p>Mã xác nhận đăng ký tài khoản VSIA của bạn là:</p><h2>${code}</h2><p>Mã có hiệu lực trong 15 phút.</p>`,
  });

  req.session.pendingEmail = normalizedEmail;
  res.redirect('/dang-ky/xac-thuc');
});

router.get('/dang-ky/xac-thuc', (req, res) => {
  if (!req.session.pendingEmail) return res.redirect('/dang-ky');
  res.render('verify-email', { error: null, email: req.session.pendingEmail });
});

router.post('/dang-ky/xac-thuc', async (req, res) => {
  const email = req.session.pendingEmail;
  if (!email) return res.redirect('/dang-ky');

  const pending = await PendingRegistration.findOne({ email });
  if (!pending) {
    return res.render('verify-email', { error: 'Mã đã hết hạn, vui lòng đăng ký lại.', email });
  }
  if (pending.attempts >= 5) {
    await PendingRegistration.deleteOne({ _id: pending._id });
    req.session.pendingEmail = null;
    return res.redirect('/dang-ky');
  }
  if (pending.code !== (req.body.code || '').trim()) {
    pending.attempts += 1;
    await pending.save();
    return res.render('verify-email', { error: 'Mã xác nhận không đúng.', email });
  }

  let user;
  try {
    user = await User.create({ name: pending.name, email: pending.email, passwordHash: pending.passwordHash });
  } catch (err) {
    if (err.code === 11000) {
      await PendingRegistration.deleteOne({ _id: pending._id });
      req.session.pendingEmail = null;
      return res.render('register', { error: 'Email này đã được đăng ký.', form: {} });
    }
    throw err;
  }

  await PendingRegistration.deleteOne({ _id: pending._id });
  await broadcastStats();

  req.session.pendingEmail = null;
  req.session.userId = user._id;
  res.redirect('/');
});

router.post('/dang-ky/gui-lai-ma', async (req, res) => {
  const email = req.session.pendingEmail;
  if (!email) return res.redirect('/dang-ky');

  const resendLimit = checkAndConsume(`resend-code:${email}`, { minuteLimit: 1, dayLimit: 5 });
  if (!resendLimit.allowed) {
    return res.render('verify-email', { error: `Vui lòng đợi ${resendLimit.retryAfterSeconds} giây trước khi gửi lại mã.`, email });
  }

  const pending = await PendingRegistration.findOne({ email });
  if (!pending) return res.redirect('/dang-ky');

  pending.code = generateCode();
  pending.attempts = 0;
  pending.createdAt = new Date();
  await pending.save();

  await sendMail({
    to: email,
    subject: 'Mã xác nhận đăng ký VSIA',
    html: `<p>Mã xác nhận mới của bạn là:</p><h2>${pending.code}</h2><p>Mã có hiệu lực trong 15 phút.</p>`,
  });

  res.render('verify-email', { error: null, email, resent: true });
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
