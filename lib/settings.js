const SiteSettings = require('../models/SiteSettings');

async function getSiteSettings() {
  let settings = await SiteSettings.findOne();
  if (!settings) {
    settings = await SiteSettings.create({});
  }
  // Di chuyển ảnh Hero đơn (kiểu cũ) sang mảng nhiều ảnh (slideshow) lần đầu tải sau khi nâng cấp.
  if ((!settings.heroImages || settings.heroImages.length === 0) && settings.heroImage) {
    settings.heroImages.push({ url: settings.heroImage });
    settings.heroImage = null;
    await settings.save();
  }
  return settings;
}

async function loadSiteSettings(req, res, next) {
  const settings = await getSiteSettings();
  res.locals.siteLogo = settings.logo;
  res.locals.heroImage = settings.heroImage;
  res.locals.heroImages = settings.heroImages || [];
  res.locals.solutionImage = settings.solutionImage;
  res.locals.solutionHeroImage = settings.solutionHeroImage;
  res.locals.projectImages = settings.projectImages || [];
  res.locals.bizLabImage = settings.bizLabImage;
  res.locals.bizTeacherImage = settings.bizTeacherImage;
  res.locals.bizEventsImage = settings.bizEventsImage;
  res.locals.bizRoboticsImage = settings.bizRoboticsImage;
  res.locals.contactImage = settings.contactImage;
  res.locals.ecoMovementImage = settings.ecoMovementImage;
  res.locals.ecoEquipmentImage = settings.ecoEquipmentImage;
  res.locals.ecoCompetitionImage = settings.ecoCompetitionImage;
  res.locals.ecoTrainingImage = settings.ecoTrainingImage;
  res.locals.hoiThaoHeroImage = settings.hoiThaoHeroImage;
  next();
}

module.exports = { getSiteSettings, loadSiteSettings };
