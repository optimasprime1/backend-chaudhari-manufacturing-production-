const mongoose = require("mongoose");

const quoteRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 180 },
    phone: { type: String, trim: true, maxlength: 40 },
    company: { type: String, trim: true, maxlength: 180 },
    productId: { type: String, trim: true, uppercase: true, index: true },
    quantity: { type: Number, min: 1 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    status: { type: String, enum: ["new", "in-progress", "quoted", "closed"], default: "new", index: true },
  },
  { timestamps: true },
);

quoteRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model("QuoteRequest", quoteRequestSchema);
