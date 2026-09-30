const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    alt: { type: String, trim: true, maxlength: 200 },
    type: { type: String, enum: ["image", "video", "document"], default: "image", index: true },
    productId: { type: String, trim: true, uppercase: true, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Media", mediaSchema);
