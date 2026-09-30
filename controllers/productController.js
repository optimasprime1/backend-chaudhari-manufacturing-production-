const mongoose = require("mongoose");
const ActivityLog = require("../models/ActivityLog");
const Category = require("../models/Category");
const { getProductModel, getProductModels } = require("../models/Product");
const { AppError, asyncHandler } = require("../middleware/error");

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function productIdFilter(id) {
  const filters = [{ productId: String(id).toUpperCase() }];
  if (mongoose.isValidObjectId(id)) filters.push({ _id: id });
  return { $or: filters };
}

async function resolveCategory(categoryValue) {
  if (!categoryValue) return null;
  const value = String(categoryValue).trim();
  const exact = new RegExp(`^${escapeRegExp(value)}$`, "i");
  return Category.findOne({ $or: [{ categoryId: exact }, { name: exact }, { slug: exact }] });
}

function populateProductQuery(query) {
  return query.populate("category", "categoryId name slug");
}

function activeProductFilter(includeInactive = false) {
  return includeInactive ? {} : { $or: [{ isActive: true }, { isActive: { $exists: false } }] };
}

async function findCategory(value) {
  if (!value) return null;
  const exact = new RegExp(`^${escapeRegExp(String(value).trim())}$`, "i");
  return Category.findOne({ $or: [{ categoryId: exact }, { name: exact }, { slug: exact }] });
}

async function normalizeProductCategory(product, category) {
  product.set({
    category: category._id,
    categoryId: category.categoryId,
    categoryName: category.name,
  });
  await product.populate("category", "categoryId name slug");
  return product;
}

async function findProductsAcrossCollections(filter, sort, limit, category = null, categoryRequested = false) {
  if (categoryRequested && !category) return [];
  const categories = category
    ? [category]
    : await Category.find().select("categoryId name slug");
  const results = await Promise.all(
    categories.map(async (item) => {
      const Product = getProductModel(item);
      const products = await Product.find(filter).sort(sort).limit(limit);
      return Promise.all(products.map((product) => normalizeProductCategory(product, item)));
    }),
  );
  return results
    .flat()
    .sort((left, right) => {
      const leftValue = left[Object.keys(sort)[0]];
      const rightValue = right[Object.keys(sort)[0]];
      if (leftValue instanceof Date && rightValue instanceof Date) {
        return rightValue.getTime() - leftValue.getTime();
      }
      return String(leftValue || "").localeCompare(String(rightValue || ""));
    })
    .slice(0, limit);
}

const getProducts = asyncHandler(async (req, res) => {
  const filter = activeProductFilter(req.query.includeInactive === "true");
  const category = await findCategory(req.query.category || req.query.categoryId);

  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 100);
  const products = await findProductsAcrossCollections(
    filter,
    { createdAt: -1 },
    limit,
    req.query.category || req.query.categoryId ? category : null,
    Boolean(req.query.category || req.query.categoryId),
  );

  res.json({ success: true, count: products.length, data: products });
});

const getProductById = asyncHandler(async (req, res) => {
  const categories = await Category.find().select("categoryId name slug");
  const matches = await Promise.all(
    categories.map(async (category) => {
      const Product = getProductModel(category);
      const product = await Product.findOne(productIdFilter(req.params.id));
      return product ? normalizeProductCategory(product, category) : null;
    }),
  );
  const product = matches.find(Boolean);
  if (!product) throw new AppError("Product not found.", 404);
  res.json({ success: true, data: product });
});

const searchProducts = asyncHandler(async (req, res) => {
  const query = String(req.query.q || "").trim();
  const filter = activeProductFilter();
  const category = await findCategory(req.query.category || req.query.categoryId);

  if (query) {
    const terms = query.split(/\s+/).filter(Boolean).slice(0, 8);
    filter.$and = terms.map((term) => {
      const expression = new RegExp(escapeRegExp(term), "i");
      return {
        $or: [
          { name: expression },
          { productId: expression },
          { model: expression },
          { description: expression },
          { categoryId: expression },
          { categoryName: expression },
          { tags: expression },
        ],
      };
    });
  }

  const products = await findProductsAcrossCollections(
    filter,
    { name: 1 },
    100,
    req.query.category || req.query.categoryId ? category : null,
    Boolean(req.query.category || req.query.categoryId),
  );
  res.json({ success: true, count: products.length, data: products });
});

function slugify(value) {
  return String(value)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

async function productPayload(body, existing = {}) {
  const name = body.name ?? existing.name;
  const submittedDescription = typeof body.description === "string" ? body.description.trim() : "";
  const description = submittedDescription || existing.description || "Description not provided.";
  const categoryValue =
    body.categoryId ||
    body.category ||
    existing.categoryId ||
    existing.category?.categoryId ||
    existing.category?.name;
  const category = await resolveCategory(categoryValue);

  if (!String(name || "").trim() || !category) {
    throw new AppError("A product name and valid categoryId are required.", 400);
  }

  return {
    productId: body.productId ? slugify(body.productId) : existing.productId || `${slugify(name)}-${Date.now().toString(36).toUpperCase()}`,
    name: String(name).trim(),
    model: body.model ?? existing.model ?? "",
    average: body.average ?? existing.average ?? "",
    motor: body.motor ?? existing.motor ?? "",
    operation: body.operation ?? existing.operation ?? "",
    body_type: body.body_type ?? body.bodyType ?? existing.body_type ?? existing.bodyType ?? "",
    category: category._id,
    categoryId: category.categoryId,
    categoryName: category.name,
    description,
    art: body.art ?? existing.art ?? "art-processing",
    images: Array.isArray(body.images) ? body.images : existing.images || [],
    specifications: body.specifications ?? existing.specifications ?? {},
    tags: Array.isArray(body.tags) ? body.tags : existing.tags || [],
    isActive: body.isActive ?? existing.isActive ?? true,
  };
}

async function logActivity(action, product, req) {
  await ActivityLog.create({
    action,
    entity: "Product",
    entityId: product.productId,
    actor: req.user?._id,
    metadata: { name: product.name },
  });
}

const createProduct = asyncHandler(async (req, res) => {
  const payload = await productPayload(req.body || {});
  const category = await Category.findById(payload.category);
  const Product = getProductModel(category);
  const product = await Product.create(payload);
  await logActivity("created", product, req);
  const populated = await populateProductQuery(Product.findById(product._id));
  res.status(201).json({ success: true, data: populated });
});

const updateProduct = asyncHandler(async (req, res) => {
  const models = await getProductModels();
  const currentMatch = await Promise.all(
    models.map(async (Model) => ({ Model, product: await Model.findOne(productIdFilter(req.params.id)) })),
  );
  const match = currentMatch.find((result) => result.product);
  if (!match) throw new AppError("Product not found.", 404);
  const { Model: CurrentModel, product: current } = match;
  const payload = await productPayload(req.body || {}, current.toObject());
  const category = await Category.findById(payload.category);
  const TargetModel = getProductModel(category);
  let product;
  if (TargetModel.collection.name === CurrentModel.collection.name) {
    product = await TargetModel.findByIdAndUpdate(current._id, payload, {
      new: true,
      runValidators: true,
    });
  } else {
    product = await TargetModel.create({ _id: current._id, ...payload });
    await CurrentModel.deleteOne({ _id: current._id });
  }
  await logActivity("updated", product, req);
  const populated = await populateProductQuery(TargetModel.findById(product._id));
  res.json({ success: true, data: populated });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const models = await getProductModels();
  const matches = await Promise.all(
    models.map(async (Model) => ({ Model, product: await Model.findOneAndDelete(productIdFilter(req.params.id)) })),
  );
  const product = matches.find((result) => result.product)?.product;
  if (!product) throw new AppError("Product not found.", 404);
  await logActivity("deleted", product, req);
  res.json({ success: true, message: "Product deleted successfully." });
});

module.exports = {
  getProducts,
  getProductById,
  searchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};
