const express = require('express');
const router = express.Router();

const Course = require('../models/Course');
const Media = require('../models/Media');
const Article = require('../models/Article');
const TeamMember = require('../models/TeamMember');
const Partner = require('../models/Partner');
const User = require('../models/User');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { uploadImage, uploadVideo, uploadCourseFiles, friendlyUploadError } = require('../middleware/upload');
const { computeStats, addClient, removeClient, broadcastStats } = require('../lib/stats');
const { unlinkUploaded } = require('../lib/files');
const { getSiteSettings } = require('../lib/settings');
const { getAllPageContents, PAGE_DEFAULTS } = require('../lib/pageContent');
const PageContent = require('../models/PageContent');

router.use(requireAuth, requireAdmin);

function courseFieldsFromBody(body) {
  const isFree = body.isFree === 'on';
  return {
    title: body.title,
    description: body.description,
    provider: body.provider || 'VSIA',
    category: body.category || 'STEM',
    isFree,
    price: isFree ? 0 : Number(body.price) || 0,
    rating: Number(body.rating) || 0,
  };
}

router.get('/', async (req, res) => {
  const stats = await computeStats();
  res.render('admin/dashboard', { active: 'dashboard', stats });
});

router.get('/stats-stream', async (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders();

  addClient(res);
  res.write(`data: ${JSON.stringify(await computeStats())}\n\n`);

  req.on('close', () => removeClient(res));
});

// --- Khoá học ---

router.get('/khoa-hoc', async (req, res) => {
  const courses = await Course.find().sort({ createdAt: -1 }).lean();
  res.render('admin/courses', { courses, active: 'khoa-hoc' });
});

router.get('/khoa-hoc/moi', (req, res) => {
  res.render('admin/course-form', { course: null, error: null, active: 'khoa-hoc' });
});

router.post('/khoa-hoc/moi', (req, res) => {
  uploadCourseFiles(req, res, async (err) => {
    if (err) {
      return res.render('admin/course-form', { course: null, error: friendlyUploadError(err), active: 'khoa-hoc' });
    }

    const image = req.files?.image?.[0] ? `/uploads/images/${req.files.image[0].filename}` : null;
    const materials = (req.files?.materials || []).map((f) => ({
      name: f.originalname,
      filePath: `/uploads/documents/${f.filename}`,
    }));

    await Course.create({ ...courseFieldsFromBody(req.body), image, materials });
    await broadcastStats();
    res.redirect('/admin/khoa-hoc');
  });
});

router.get('/khoa-hoc/:id/sua', async (req, res) => {
  const course = await Course.findById(req.params.id).lean().catch(() => null);
  if (!course) return res.status(404).render('404');
  res.render('admin/course-form', { course, error: null });
});

router.post('/khoa-hoc/:id/sua', (req, res) => {
  uploadCourseFiles(req, res, async (err) => {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).render('404');

    if (err) {
      return res.render('admin/course-form', { course: course.toObject(), error: friendlyUploadError(err) });
    }

    Object.assign(course, courseFieldsFromBody(req.body));

    if (req.files?.image?.[0]) {
      unlinkUploaded(course.image);
      course.image = `/uploads/images/${req.files.image[0].filename}`;
    }

    if (req.files?.materials?.length) {
      course.materials.push(...req.files.materials.map((f) => ({
        name: f.originalname,
        filePath: `/uploads/documents/${f.filename}`,
      })));
    }

    await course.save();
    await broadcastStats();
    res.redirect('/admin/khoa-hoc');
  });
});

router.post('/khoa-hoc/:id/xoa', async (req, res) => {
  const course = await Course.findByIdAndDelete(req.params.id);
  if (course) {
    unlinkUploaded(course.image);
    course.materials.forEach((m) => unlinkUploaded(m.filePath));
  }
  await broadcastStats();
  res.redirect('/admin/khoa-hoc');
});

router.post('/khoa-hoc/:id/tai-lieu/:materialId/xoa', async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (course) {
    const material = course.materials.id(req.params.materialId);
    if (material) {
      unlinkUploaded(material.filePath);
      material.deleteOne();
      await course.save();
      await broadcastStats();
    }
  }
  res.redirect(`/admin/khoa-hoc/${req.params.id}/sua`);
});

// --- Thư viện ảnh/video ---

router.get('/thu-vien', async (req, res) => {
  const mediaItems = await Media.find().sort({ createdAt: -1 }).lean();
  res.render('admin/gallery', { mediaItems, error: null });
});

router.post('/thu-vien/anh', (req, res) => {
  uploadImage.single('image')(req, res, async (err) => {
    const mediaItems = await Media.find().sort({ createdAt: -1 }).lean();
    if (err) {
      return res.render('admin/gallery', { mediaItems, error: friendlyUploadError(err) });
    }
    if (!req.file) {
      return res.render('admin/gallery', { mediaItems, error: 'Vui lòng chọn ảnh.' });
    }
    await Media.create({
      title: req.body.title || req.file.originalname,
      type: 'image',
      filePath: `/uploads/images/${req.file.filename}`,
    });
    await broadcastStats();
    res.redirect('/admin/thu-vien');
  });
});

router.post('/thu-vien/video', (req, res) => {
  uploadVideo.single('video')(req, res, async (err) => {
    const mediaItems = await Media.find().sort({ createdAt: -1 }).lean();
    if (err) {
      return res.render('admin/gallery', { mediaItems, error: friendlyUploadError(err) });
    }
    if (!req.file) {
      return res.render('admin/gallery', { mediaItems, error: 'Vui lòng chọn video.' });
    }
    await Media.create({
      title: req.body.title || req.file.originalname,
      type: 'video',
      filePath: `/uploads/videos/${req.file.filename}`,
    });
    await broadcastStats();
    res.redirect('/admin/thu-vien');
  });
});

router.post('/thu-vien/:id/sua', (req, res) => {
  Media.findById(req.params.id).then((media) => {
    if (!media) return res.status(404).render('404');

    const uploader = media.type === 'video' ? uploadVideo.single('file') : uploadImage.single('file');
    uploader(req, res, async (err) => {
      if (err) {
        const mediaItems = await Media.find().sort({ createdAt: -1 }).lean();
        return res.render('admin/gallery', { mediaItems, error: friendlyUploadError(err) });
      }

      media.title = (req.body.title || media.title).trim() || media.title;
      if (req.file) {
        unlinkUploaded(media.filePath);
        const subfolder = media.type === 'video' ? 'videos' : 'images';
        media.filePath = `/uploads/${subfolder}/${req.file.filename}`;
      }
      await media.save();
      await broadcastStats();
      res.redirect('/admin/thu-vien');
    });
  });
});

router.post('/thu-vien/:id/xoa', async (req, res) => {
  const media = await Media.findByIdAndDelete(req.params.id);
  if (media) unlinkUploaded(media.filePath);
  await broadcastStats();
  res.redirect('/admin/thu-vien');
});

// --- Bài viết ---

function sanitizeSourceUrl(raw) {
  const value = (raw || '').trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

router.get('/bai-viet', async (req, res) => {
  const articles = await Article.find().sort({ createdAt: -1 }).lean();
  res.render('admin/articles', { articles, active: 'bai-viet' });
});

router.get('/bai-viet/moi', (req, res) => {
  res.render('admin/article-form', { article: null, error: null, active: 'bai-viet' });
});

router.post('/bai-viet/moi', (req, res) => {
  uploadImage.single('image')(req, res, async (err) => {
    if (err) {
      return res.render('admin/article-form', { article: null, error: friendlyUploadError(err), active: 'bai-viet' });
    }

    const image = req.file ? `/uploads/images/${req.file.filename}` : null;
    await Article.create({
      title: req.body.title,
      summary: req.body.summary,
      content: req.body.content,
      image,
      sourceUrl: sanitizeSourceUrl(req.body.sourceUrl),
    });
    await broadcastStats();
    res.redirect('/admin/bai-viet');
  });
});

router.get('/bai-viet/:id/sua', async (req, res) => {
  const article = await Article.findById(req.params.id).lean().catch(() => null);
  if (!article) return res.status(404).render('404');
  res.render('admin/article-form', { article, error: null, active: 'bai-viet' });
});

router.post('/bai-viet/:id/sua', (req, res) => {
  uploadImage.single('image')(req, res, async (err) => {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).render('404');

    if (err) {
      return res.render('admin/article-form', { article: article.toObject(), error: friendlyUploadError(err), active: 'bai-viet' });
    }

    article.title = req.body.title;
    article.summary = req.body.summary;
    article.content = req.body.content;
    article.sourceUrl = sanitizeSourceUrl(req.body.sourceUrl);

    if (req.file) {
      unlinkUploaded(article.image);
      article.image = `/uploads/images/${req.file.filename}`;
    }

    await article.save();
    await broadcastStats();
    res.redirect('/admin/bai-viet');
  });
});

router.post('/bai-viet/:id/xoa', async (req, res) => {
  const article = await Article.findByIdAndDelete(req.params.id);
  if (article) unlinkUploaded(article.image);
  await broadcastStats();
  res.redirect('/admin/bai-viet');
});

// --- Đội ngũ (Ban lãnh đạo & Hội đồng chuyên gia) ---

function parseAchievements(raw) {
  return (raw || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

router.get('/doi-ngu', async (req, res) => {
  const teamMembers = await TeamMember.find().sort({ order: 1, createdAt: 1 }).lean();
  res.render('admin/team', { teamMembers, active: 'doi-ngu' });
});

router.get('/doi-ngu/moi', (req, res) => {
  res.render('admin/team-form', { member: null, error: null, active: 'doi-ngu' });
});

router.post('/doi-ngu/moi', (req, res) => {
  uploadImage.single('photo')(req, res, async (err) => {
    if (err) {
      return res.render('admin/team-form', { member: null, error: friendlyUploadError(err), active: 'doi-ngu' });
    }

    const photo = req.file ? `/uploads/images/${req.file.filename}` : null;
    await TeamMember.create({
      name: req.body.name,
      title: req.body.title,
      group: req.body.group === 'leadership' ? 'leadership' : 'expert',
      bio: req.body.bio || null,
      highlight: req.body.highlight || null,
      achievements: parseAchievements(req.body.achievements),
      order: Number(req.body.order) || 0,
      photo,
    });
    await broadcastStats();
    res.redirect('/admin/doi-ngu');
  });
});

router.get('/doi-ngu/:id/sua', async (req, res) => {
  const member = await TeamMember.findById(req.params.id).lean().catch(() => null);
  if (!member) return res.status(404).render('404');
  res.render('admin/team-form', { member, error: null, active: 'doi-ngu' });
});

router.post('/doi-ngu/:id/sua', (req, res) => {
  uploadImage.single('photo')(req, res, async (err) => {
    const member = await TeamMember.findById(req.params.id);
    if (!member) return res.status(404).render('404');

    if (err) {
      return res.render('admin/team-form', { member: member.toObject(), error: friendlyUploadError(err), active: 'doi-ngu' });
    }

    member.name = req.body.name;
    member.title = req.body.title;
    member.group = req.body.group === 'leadership' ? 'leadership' : 'expert';
    member.bio = req.body.bio || null;
    member.highlight = req.body.highlight || null;
    member.achievements = parseAchievements(req.body.achievements);
    member.order = Number(req.body.order) || 0;

    if (req.file) {
      unlinkUploaded(member.photo);
      member.photo = `/uploads/images/${req.file.filename}`;
    }

    await member.save();
    await broadcastStats();
    res.redirect('/admin/doi-ngu');
  });
});

router.post('/doi-ngu/:id/xoa', async (req, res) => {
  const member = await TeamMember.findByIdAndDelete(req.params.id);
  if (member) unlinkUploaded(member.photo);
  await broadcastStats();
  res.redirect('/admin/doi-ngu');
});

// --- Đối tác đồng hành ---

router.get('/doi-tac', async (req, res) => {
  const partners = await Partner.find().sort({ order: 1, createdAt: 1 }).lean();
  res.render('admin/partners', { partners, active: 'doi-tac' });
});

router.get('/doi-tac/moi', (req, res) => {
  res.render('admin/partner-form', { partner: null, error: null, active: 'doi-tac' });
});

router.post('/doi-tac/moi', (req, res) => {
  uploadImage.single('logo')(req, res, async (err) => {
    if (err) {
      return res.render('admin/partner-form', { partner: null, error: friendlyUploadError(err), active: 'doi-tac' });
    }

    const logo = req.file ? `/uploads/images/${req.file.filename}` : null;
    await Partner.create({
      name: req.body.name,
      tagline: req.body.tagline || null,
      order: Number(req.body.order) || 0,
      logo,
    });
    await broadcastStats();
    res.redirect('/admin/doi-tac');
  });
});

router.get('/doi-tac/:id/sua', async (req, res) => {
  const partner = await Partner.findById(req.params.id).lean().catch(() => null);
  if (!partner) return res.status(404).render('404');
  res.render('admin/partner-form', { partner, error: null, active: 'doi-tac' });
});

router.post('/doi-tac/:id/sua', (req, res) => {
  uploadImage.single('logo')(req, res, async (err) => {
    const partner = await Partner.findById(req.params.id);
    if (!partner) return res.status(404).render('404');

    if (err) {
      return res.render('admin/partner-form', { partner: partner.toObject(), error: friendlyUploadError(err), active: 'doi-tac' });
    }

    partner.name = req.body.name;
    partner.tagline = req.body.tagline || null;
    partner.order = Number(req.body.order) || 0;

    if (req.file) {
      unlinkUploaded(partner.logo);
      partner.logo = `/uploads/images/${req.file.filename}`;
    }

    await partner.save();
    await broadcastStats();
    res.redirect('/admin/doi-tac');
  });
});

router.post('/doi-tac/:id/xoa', async (req, res) => {
  const partner = await Partner.findByIdAndDelete(req.params.id);
  if (partner) unlinkUploaded(partner.logo);
  await broadcastStats();
  res.redirect('/admin/doi-tac');
});

// --- Người dùng ---

router.get('/nguoi-dung', async (req, res) => {
  const users = await User.find().select('-passwordHash').sort({ createdAt: -1 }).lean();
  res.render('admin/users', { users, error: null });
});

router.post('/nguoi-dung/:id/vai-tro', async (req, res) => {
  const { role } = req.body;

  if (!['admin', 'giaovien'].includes(role)) {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 }).lean();
    return res.render('admin/users', { users, error: 'Vai trò không hợp lệ.' });
  }

  if (req.params.id === String(req.user._id)) {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 }).lean();
    return res.render('admin/users', { users, error: 'Không thể tự đổi vai trò của chính mình.' });
  }

  await User.findByIdAndUpdate(req.params.id, { role });
  await broadcastStats();
  res.redirect('/admin/nguoi-dung');
});

// --- Cài đặt (logo trang web, ảnh minh hoạ, nội dung Hero từng trang) ---

async function renderSettings(res, error) {
  const [settings, pages] = await Promise.all([getSiteSettings(), getAllPageContents()]);
  res.render('admin/settings', { settings, pages, error, active: 'cai-dat' });
}

router.get('/cai-dat', async (req, res) => {
  await renderSettings(res, null);
});

router.post('/cai-dat/logo', (req, res) => {
  uploadImage.single('logo')(req, res, async (err) => {
    if (err) return renderSettings(res, friendlyUploadError(err));

    const settings = await getSiteSettings();
    if (!req.file) return renderSettings(res, 'Vui lòng chọn file logo.');

    unlinkUploaded(settings.logo);
    settings.logo = `/uploads/images/${req.file.filename}`;
    await settings.save();
    res.redirect('/admin/cai-dat');
  });
});

router.post('/cai-dat/logo/xoa', async (req, res) => {
  const settings = await getSiteSettings();
  unlinkUploaded(settings.logo);
  settings.logo = null;
  await settings.save();
  res.redirect('/admin/cai-dat');
});

router.post('/cai-dat/anh-hero', (req, res) => {
  uploadImage.single('heroImage')(req, res, async (err) => {
    if (err) return renderSettings(res, friendlyUploadError(err));

    const settings = await getSiteSettings();
    if (!req.file) return renderSettings(res, 'Vui lòng chọn ảnh.');

    unlinkUploaded(settings.heroImage);
    settings.heroImage = `/uploads/images/${req.file.filename}`;
    await settings.save();
    res.redirect('/admin/cai-dat');
  });
});

router.post('/cai-dat/anh-hero/xoa', async (req, res) => {
  const settings = await getSiteSettings();
  unlinkUploaded(settings.heroImage);
  settings.heroImage = null;
  await settings.save();
  res.redirect('/admin/cai-dat');
});

router.post('/cai-dat/anh-giai-phap', (req, res) => {
  uploadImage.single('solutionImage')(req, res, async (err) => {
    if (err) return renderSettings(res, friendlyUploadError(err));

    const settings = await getSiteSettings();
    if (!req.file) return renderSettings(res, 'Vui lòng chọn ảnh.');

    unlinkUploaded(settings.solutionImage);
    settings.solutionImage = `/uploads/images/${req.file.filename}`;
    await settings.save();
    res.redirect('/admin/cai-dat');
  });
});

router.post('/cai-dat/anh-giai-phap/xoa', async (req, res) => {
  const settings = await getSiteSettings();
  unlinkUploaded(settings.solutionImage);
  settings.solutionImage = null;
  await settings.save();
  res.redirect('/admin/cai-dat');
});

const BIZ_IMAGE_FIELDS = {
  lab: 'bizLabImage',
  teacher: 'bizTeacherImage',
  events: 'bizEventsImage',
  robotics: 'bizRoboticsImage',
};

router.post('/cai-dat/anh-linh-vuc/:key', (req, res) => {
  const field = BIZ_IMAGE_FIELDS[req.params.key];
  if (!field) return res.status(404).render('404');

  uploadImage.single('image')(req, res, async (err) => {
    if (err) return renderSettings(res, friendlyUploadError(err));

    const settings = await getSiteSettings();
    if (!req.file) return renderSettings(res, 'Vui lòng chọn ảnh.');

    unlinkUploaded(settings[field]);
    settings[field] = `/uploads/images/${req.file.filename}`;
    await settings.save();
    res.redirect('/admin/cai-dat');
  });
});

router.post('/cai-dat/anh-linh-vuc/:key/xoa', async (req, res) => {
  const field = BIZ_IMAGE_FIELDS[req.params.key];
  if (!field) return res.status(404).render('404');

  const settings = await getSiteSettings();
  unlinkUploaded(settings[field]);
  settings[field] = null;
  await settings.save();
  res.redirect('/admin/cai-dat');
});

router.post('/cai-dat/trang/:pageKey', async (req, res) => {
  if (!PAGE_DEFAULTS[req.params.pageKey]) return res.status(404).render('404');

  await PageContent.findOneAndUpdate(
    { pageKey: req.params.pageKey },
    {
      heroBadge: req.body.heroBadge || '',
      heroTitleLine1: req.body.heroTitleLine1 || '',
      heroTitleLine2: req.body.heroTitleLine2 || '',
      heroSubtitle: req.body.heroSubtitle || '',
      heroCtaText: req.body.heroCtaText || '',
      heroCtaLink: req.body.heroCtaLink || '',
    },
    { upsert: true },
  );
  res.redirect('/admin/cai-dat');
});

module.exports = router;
