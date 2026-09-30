const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: [true, "productId is required"],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 120,
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: 180,
    },
    model: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    average: { type: String, trim: true, default: "" },
    motor: { type: String, trim: true, default: "" },
    operation: { type: String, trim: true, default: "" },
    body_type: { type: String, trim: true, default: "" },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Product category is required"],
    },
    categoryId: {
      type: String,
      required: [true, "Product categoryId is required"],
      trim: true,
      uppercase: true,
      index: true,
    },
    categoryName: {
      type: String,
      required: [true, "Product categoryName is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
      maxlength: 2000,
    },
    art: {
      type: String,
      trim: true,
      default: "art-processing",
    },
    images: {
      type: [String],
      default: [],
    },
    specifications: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    tags: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true },
);

productSchema.index({ name: 1 });
productSchema.index({ model: 1 });
productSchema.index({ categoryName: 1 });
productSchema.index({ name: "text", model: "text", productId: "text", description: "text", categoryName: "text" });

const legacyProductSchema = productSchema.clone();
legacyProductSchema.add({
  migratedToCategoryCollection: { type: Boolean, default: false, select: false },
});
const LegacyProduct = mongoose.model("LegacyProduct", legacyProductSchema, "products");

function getProductModel(category) {
  const categoryKey = String(
    typeof category === "object"
      ? category.slug || category.categoryId || category.name || ""
      : category || "",
  )
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (!categoryKey) {
    throw new Error("A valid product category is required to select its collection.");
  }

  const modelName = `Product_${categoryKey}`;
  return mongoose.models[modelName] || mongoose.model(modelName, productSchema, categoryKey);
}

async function getProductModels() {
  const Category = require("./Category");
  const categories = await Category.find().select("categoryId name slug");
  return categories.map((category) => getProductModel(category));
}

module.exports = { LegacyProduct, getProductModel, getProductModels };
