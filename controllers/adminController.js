const ActivityLog = require("../models/ActivityLog");
const Category = require("../models/Category");
const Contact = require("../models/Contact");
const Enquiry = require("../models/Enquiry");
const { getProductModel, getProductModels } = require("../models/Product");
const QuoteRequest = require("../models/QuoteRequest");
const { asyncHandler } = require("../middleware/error");

const getDashboard = asyncHandler(async (req, res) => {
  const [productModels, categories, contacts, enquiries, quoteRequests] = await Promise.all([
    getProductModels(),
    Category.countDocuments(),
    Contact.countDocuments(),
    Enquiry.countDocuments(),
    QuoteRequest.countDocuments(),
  ]);
  const productCounts = await Promise.all(productModels.map((Model) => Model.countDocuments()));
  const products = productCounts.reduce((total, count) => total + count, 0);

  res.json({
    success: true,
    data: { admin: { id: req.user._id, name: req.user.name, email: req.user.email }, products, categories, contacts, enquiries, quoteRequests },
  });
});

const getDashboardStats = asyncHandler(async (req, res) => {
  const categories = await Category.find().select("categoryId name slug");
  const productModels = categories.map((category) => ({
    category,
    Model: getProductModel(category),
  }));
  const recentlyAddedSince = new Date();
  recentlyAddedSince.setDate(recentlyAddedSince.getDate() - 30);

  const modelStats = await Promise.all(
    productModels.map(async ({ category, Model }) => {
      const [total, recentlyAdded, recentProducts] = await Promise.all([
        Model.countDocuments(),
        Model.countDocuments({ createdAt: { $gte: recentlyAddedSince } }),
        Model.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .lean(),
      ]);
      return {
        total,
        recentlyAdded,
        recentProducts: recentProducts.map((product) => ({
          ...product,
          category: product.categoryName || category.name,
        })),
      };
    }),
  );

  const recentProducts = modelStats
    .flatMap((stats) => stats.recentProducts)
    .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0))
    .slice(0, 5);

  res.json({
    success: true,
    data: {
      totalProducts: modelStats.reduce((total, stats) => total + stats.total, 0),
      totalCategories: categories.length,
      recentlyAddedProducts: modelStats.reduce((total, stats) => total + stats.recentlyAdded, 0),
      recentProducts,
    },
  });
});

const getActivityLogs = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
  const logs = await ActivityLog.find().populate("actor", "name email").sort({ createdAt: -1 }).limit(limit);
  res.json({ success: true, count: logs.length, data: logs });
});

module.exports = { getDashboard, getDashboardStats, getActivityLogs };
