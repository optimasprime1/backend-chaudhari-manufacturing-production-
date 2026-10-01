const express = require("express");
const Enquiry = require("../models/Enquiry");
const { createEnquiry } = require("../controllers/publicController");
const { protect, adminOnly } = require("../middleware/auth");
const { AppError, asyncHandler } = require("../middleware/error");

const router = express.Router();

// Public enquiry submission.
router.post("/", createEnquiry);

// Admin-only enquiry management.
router.get("/", protect, adminOnly, asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
  const filter = {};

  if (req.query.status) {
    filter.status = String(req.query.status).trim();
  }

  const enquiries = await Enquiry.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  res.json({
    success: true,
    count: enquiries.length,
    data: enquiries,
  });
}));

router.get("/:id", protect, adminOnly, asyncHandler(async (req, res) => {
  if (!require("mongoose").isValidObjectId(req.params.id)) {
    throw new AppError("Invalid enquiry id.", 400);
  }

  const enquiry = await Enquiry.findById(req.params.id).lean();

  if (!enquiry) {
    throw new AppError("Enquiry not found.", 404);
  }

  res.json({ success: true, data: enquiry });
}));

router.patch("/:id", protect, adminOnly, asyncHandler(async (req, res) => {
  if (!require("mongoose").isValidObjectId(req.params.id)) {
    throw new AppError("Invalid enquiry id.", 400);
  }

  const allowedStatuses = new Set(["new", "in-progress", "resolved"]);
  const status = String(req.body?.status || "").trim();

  if (!allowedStatuses.has(status)) {
    throw new AppError("Status must be one of: new, in-progress, resolved.", 400);
  }

  const enquiry = await Enquiry.findByIdAndUpdate(
    req.params.id,
    { $set: { status } },
    { new: true, runValidators: true }
  ).lean();

  if (!enquiry) {
    throw new AppError("Enquiry not found.", 404);
  }

  res.json({
    success: true,
    message: "Enquiry status updated successfully.",
    data: enquiry,
  });
}));

module.exports = router;
