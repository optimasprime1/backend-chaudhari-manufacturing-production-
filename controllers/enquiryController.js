const Enquiry = require('../models/enquiry');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateEnquiry } = require('../middleware/validators');

function toFrontendShape(row) {
  return {
    id: row._id,
    fullName: row.fullName,
    companyName: row.companyName,
    mobileNumber: row.mobileNumber,
    email: row.email,
    selectedProduct: row.selectedProduct,
    message: row.message,
    status: row.status,
    createdAt: row.createdAt
  };
}

// GET /api/enquiries
const getAllEnquiries = asyncHandler(async (req, res) => {
  const rows = await Enquiry.find().sort({ createdAt: -1 }).lean();
  res.status(200).json({ success: true, count: rows.length, data: rows.map(toFrontendShape) });
});

// GET /api/enquiries/:id
const getEnquiryById = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.findById(req.params.id).lean();
  if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found.' });
  res.status(200).json({ success: true, data: toFrontendShape(enquiry) });
});

// POST /api/enquiries  (used by the public enquiry form)
const createEnquiry = asyncHandler(async (req, res) => {
  const errors = validateEnquiry(req.body);
  if (errors.length) return res.status(400).json({ success: false, message: errors.join(' ') });

  const { fullName, companyName = null, email, mobileNumber, selectedProduct, message } = req.body;

  const enquiry = await Enquiry.create({
    fullName: fullName.trim(), companyName, mobileNumber: mobileNumber.trim(),
    email: email.trim(), selectedProduct, message: message.trim()
  });
  res.status(201).json({ success: true, message: 'Thank you! Your enquiry has been submitted successfully.', data: toFrontendShape(enquiry.toObject()) });
});

// PUT /api/enquiries/:id  (e.g. staff updating status/notes)
const updateEnquiry = asyncHandler(async (req, res) => {
  const allowed = ['fullName', 'companyName', 'mobileNumber', 'email', 'selectedProduct', 'message', 'status'];
  const updates = Object.fromEntries(allowed.filter(field => req.body[field] !== undefined).map(field => [field, req.body[field]]));
  if (!Object.keys(updates).length) return res.status(400).json({ success: false, message: 'No valid fields provided to update.' });
  const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).lean();
  if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found.' });
  res.status(200).json({ success: true, message: 'Enquiry updated.', data: toFrontendShape(enquiry) });
});

// DELETE /api/enquiries/:id
const deleteEnquiry = asyncHandler(async (req, res) => {
  const result = await Enquiry.deleteOne({ _id: req.params.id });
  if (!result.deletedCount) return res.status(404).json({ success: false, message: 'Enquiry not found.' });
  res.status(200).json({ success: true, message: 'Enquiry deleted.' });
});

module.exports = { getAllEnquiries, getEnquiryById, createEnquiry, updateEnquiry, deleteEnquiry };
