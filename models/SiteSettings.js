const mongoose = require("mongoose");

const siteSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    companyName: { type: String, required: true, trim: true },
    tagline: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    socialLinks: { type: mongoose.Schema.Types.Mixed, default: {} },
    navigation: { type: mongoose.Schema.Types.Mixed, default: {} },
    extra: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SiteSettings", siteSettingsSchema);
