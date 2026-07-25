const SiteSettings = require('../models/SiteSettings');

async function getSiteSettings() {
  let settings = await SiteSettings.findOne();
  if (!settings) {
    settings = await SiteSettings.create({});
  }
  return settings;
}

async function loadSiteSettings(req, res, next) {
  const settings = await getSiteSettings();
  res.locals.siteLogo = settings.logo;
  res.locals.heroImage = settings.heroImage;
  res.locals.solutionImage = settings.solutionImage;
  res.locals.bizLabImage = settings.bizLabImage;
  res.locals.bizTeacherImage = settings.bizTeacherImage;
  res.locals.bizEventsImage = settings.bizEventsImage;
  res.locals.bizRoboticsImage = settings.bizRoboticsImage;
  next();
}

module.exports = { getSiteSettings, loadSiteSettings };
