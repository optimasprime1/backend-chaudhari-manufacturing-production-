const express = require("express");
const { getCategories, getCategory } = require("../controllers/publicController");

const router = express.Router();

router.get("/", getCategories);
router.get("/:id", getCategory);

module.exports = router;
