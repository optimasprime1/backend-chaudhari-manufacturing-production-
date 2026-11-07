const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  companyName: { type: String, default: null },
  mobileNumber: { type: String, required: true },
  email: { type: String, required: true },
  selectedProduct: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['new', 'contacted', 'closed'], default: 'new' }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('Enquiry', enquirySchema);
