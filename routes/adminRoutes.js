const express = require("express");
const { getDashboard, getDashboardStats, getActivityLogs } = require("../controllers/adminController");
const {
  getAdminCategories,
  getAdminCategory,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
} = require("../controllers/adminCategoryController");
const { getAdminProducts } = require("../controllers/adminProductController");
const {
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const { loginAdmin, logoutAdmin, publicAdmin } = require("../controllers/authController");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();
router.post("/login", loginAdmin);
router.get("/me", protect, adminOnly, (req, res) => {
  res.json({ success: true, data: publicAdmin(req.user) });
});
router.use(protect, adminOnly);
router.post("/logout", logoutAdmin);
router.get("/dashboard/stats", getDashboardStats);
router.get("/categories", getAdminCategories);
router.get("/categories/:id", getAdminCategory);
router.post("/categories", createAdminCategory);
router.put("/categories/:id", updateAdminCategory);
router.delete("/categories/:id", deleteAdminCategory);
router.get("/products", getAdminProducts);
router.get("/products/:id", getProductById);
router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);
router.get("/", getDashboard);
router.get("/activity-logs", getActivityLogs);

module.exports = router;
