const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
  logo: { type: String, default: null },
  heroImage: { type: String, default: null },
  heroImages: [{ url: { type: String, required: true } }],
  solutionImage: { type: String, default: null },
  solutionHeroImage: { type: String, default: null },
  projectImages: [{ url: { type: String, required: true } }],
  bizLabImage: { type: String, default: null },
  bizTeacherImage: { type: String, default: null },
  bizEventsImage: { type: String, default: null },
  bizRoboticsImage: { type: String, default: null },
  contactImage: { type: String, default: null },
  ecoMovementImage: { type: String, default: null },
  ecoEquipmentImage: { type: String, default: null },
  ecoCompetitionImage: { type: String, default: null },
  ecoTrainingImage: { type: String, default: null },
  hoiThaoHeroImage: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
