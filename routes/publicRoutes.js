const express = require("express");
const {
  getPublicProducts,
  getCategories,
  getCategory,
  getSiteSettings,
  createContact,
  createEnquiry,
  createQuoteRequest,
} = require("../controllers/publicController");

const router = express.Router();

router.get("/products", getPublicProducts);
router.get("/categories", getCategories);
router.get("/categories/:id", getCategory);
router.get("/settings", getSiteSettings);
router.post("/contact", createContact);
router.post("/enquiries", createEnquiry);
router.post("/quote-requests", createQuoteRequest);

module.exports = router;
