const express = require("express");
const Category = require("../models/Category");
const { getProductModels } = require("../models/Product");
const { asyncHandler } = require("../middleware/error");

const router = express.Router();

router.get("/", asyncHandler(async (req, res) => {
  const [categories, productModels] = await Promise.all([
    Category.countDocuments({ isActive: true }),
    getProductModels(),
  ]);

  const productCounts = await Promise.all(
    productModels.map((Model) => Model.countDocuments({
      $or: [{ isActive: true }, { isActive: { $exists: false } }],
    })),
  );

  const totalProducts = productCounts.reduce((total, count) => total + count, 0);

  // These three values are used by the existing homepage counters.
  // Environment variables can override the existing displayed defaults.
  const yearsExperience = Number(process.env.YEARS_EXPERIENCE || 10);
  const machinesDelivered = Number(process.env.MACHINES_DELIVERED || 500);
  const numberOfClients = Number(process.env.NUMBER_OF_CLIENTS || 100);

  res.json({
    success: true,
    data: {
      years_experience: yearsExperience,
      machines_delivered: machinesDelivered,
      number_of_clients: numberOfClients,
      total_products: totalProducts,
      total_categories: categories,
    },
  });
}));

module.exports = router;
