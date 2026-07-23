const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

router.get('/dang-ky', (req, res) => {
  if (req.user) return res.redirect('/');
  res.render('register', { error: null, form: {} });
});

router.post('/dang-ky', async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

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
  const user = await User.create({ name, email, passwordHash });

  req.session.userId = user._id;
  res.redirect('/');
});

router.get('/dang-nhap', (req, res) => {
  if (req.user) return res.redirect('/');
  res.render('login', { error: null, redirectTo: req.query.redirect || '/' });
});

router.post('/dang-nhap', async (req, res) => {
  const { email, password, redirectTo } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase().trim() });

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

router.get('/ho-so', requireAuth, (req, res) => {
  res.render('profile', { user: req.user });
});

module.exports = router;
