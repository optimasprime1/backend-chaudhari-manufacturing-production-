const express = require("express");
const { registerAdmin, loginAdmin, getCurrentAdmin } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.get("/me", protect, getCurrentAdmin);

module.exports = router;
