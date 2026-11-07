const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  role: { type: String, default: 'admin', enum: ['admin'] },
  isActive: { type: Boolean, default: true },
  passwordHash: { type: String, required: true, select: false },
  lastLoginAt: { type: Date, default: null },
  passwordChangedAt: { type: Date, default: null }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('Admin', adminSchema);
