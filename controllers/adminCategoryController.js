const Category = require("../models/Category");
const { getProductModel } = require("../models/Product");
const { AppError, asyncHandler } = require("../middleware/error");

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function categoryPayload(body = {}) {
  const name = String(body.name || "").trim();
  const categoryId = String(body.categoryId || "").trim().toUpperCase();
  if (!name || !categoryId) {
    throw new AppError("Category name and categoryId are required.", 400);
  }

  return {
    name,
    categoryId,
    slug: slugify(name),
    description: String(body.description || "").trim(),
    image: String(body.image || "").trim(),
  };
}

async function categoryWithProductCount(category) {
  const totalProducts = await getProductModel(category).countDocuments();
  return { ...category.toObject(), totalProducts };
}

const getAdminCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  const data = await Promise.all(categories.map(categoryWithProductCount));
  res.json({ success: true, count: data.length, data });
});

const getAdminCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError("Category not found.", 404);
  res.json({ success: true, data: await categoryWithProductCount(category) });
});

const createAdminCategory = asyncHandler(async (req, res) => {
  const category = await Category.create(categoryPayload(req.body));
  res.status(201).json({ success: true, data: await categoryWithProductCount(category) });
});

const updateAdminCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { $set: categoryPayload(req.body) },
    { new: true, runValidators: true },
  );
  if (!category) throw new AppError("Category not found.", 404);
  res.json({ success: true, data: await categoryWithProductCount(category) });
});

const deleteAdminCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError("Category not found.", 404);

  const totalProducts = await getProductModel(category).countDocuments();
  if (totalProducts > 0) {
    throw new AppError("Categories with linked products cannot be deleted.", 409);
  }

  await category.deleteOne();
  res.json({ success: true, message: "Category deleted successfully." });
});

module.exports = {
  getAdminCategories,
  getAdminCategory,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
};
