const Category = require("../models/Category");
const Contact = require("../models/Contact");
const Enquiry = require("../models/Enquiry");
const mongoose = require("mongoose");
const QuoteRequest = require("../models/QuoteRequest");
const SiteSettings = require("../models/SiteSettings");
const { AppError, asyncHandler } = require("../middleware/error");
const { getProducts } = require("./productController");

const getPublicProducts = getProducts;

const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ name: 1 });
  res.json({ success: true, count: categories.length, data: categories });
});

const getCategory = asyncHandler(async (req, res) => {
  const value = String(req.params.id).trim();
  const filters = [{ categoryId: value.toUpperCase() }, { slug: value.toLowerCase() }];
  if (mongoose.isValidObjectId(value)) filters.push({ _id: value });
  const category = await Category.findOne({
    $or: filters,
    isActive: true,
  });
  if (!category) throw new AppError("Category not found.", 404);
  res.json({ success: true, data: category });
});

const getSiteSettings = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.findOne({ key: "default" });
  res.json({ success: true, data: settings });
});

function normalizeEnquiryPayload(body = {}) {
  return {
    ...body,
    name: body.name ?? body.fullName ?? body.full_name ?? body.userName ?? body.user_name,
    email: body.email ?? body.emailAddress ?? body.email_address,
    phone: body.phone ?? body.phoneNumber ?? body.phone_number,
    company: body.company ?? body.companyName ?? body.company_name,
    message: body.message ?? body.enquiry ?? body.inquiry ?? body.enquiryMessage ?? body.enquiry_message,
  };
}

const createContact = asyncHandler(async (req, res) => {
  const contact = await Contact.create(req.body || {});
  res.status(201).json({ success: true, message: "Contact request received.", data: contact });
});

const createEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.create(normalizeEnquiryPayload(req.body));
  res.status(201).json({ success: true, message: "Enquiry received.", data: enquiry });
});

const createQuoteRequest = asyncHandler(async (req, res) => {
  const quoteRequest = await QuoteRequest.create(req.body || {});
  res.status(201).json({ success: true, message: "Quote request received.", data: quoteRequest });
});

module.exports = {
  getPublicProducts,
  getCategories,
  getCategory,
  getSiteSettings,
  createContact,
  createEnquiry,
  createQuoteRequest,
};
