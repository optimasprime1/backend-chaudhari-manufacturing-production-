const Category = require("../models/Category");
const { getProductModel } = require("../models/Product");
const { AppError, asyncHandler } = require("../middleware/error");

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function findCategory(value) {
  const normalized = String(value).trim();
  const expression = new RegExp(`^${escapeRegExp(normalized)}$`, "i");
  const filters = [{ categoryId: expression }, { name: expression }, { slug: expression }];
  if (/^[a-f\d]{24}$/i.test(normalized)) filters.push({ _id: normalized });
  return Category.findOne({ $or: filters }).select("categoryId name slug");
}

function productSearchFilter(query) {
  const terms = String(query || "").trim().split(/\s+/).filter(Boolean).slice(0, 8);
  if (!terms.length) return {};
  return {
    $and: terms.map((term) => {
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
    }),
  };
}

function toAdminProduct(product, category) {
  return {
    ...product,
    category: product.categoryName || category.name,
    bodyType: product.bodyType || product.body_type || "",
    image: product.image || product.images?.[0] || "",
  };
}

const getAdminProducts = asyncHandler(async (req, res) => {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 100);
  const requestedCategory = req.query.category;
  const categories = requestedCategory
    ? [await findCategory(requestedCategory)].filter(Boolean)
    : await Category.find().select("categoryId name slug");

  if (requestedCategory && !categories.length) {
    return res.json({
      success: true,
      count: 0,
      data: [],
      pagination: { page, limit, total: 0, pages: 0 },
    });
  }

  const filter = productSearchFilter(req.query.q);
  const collectionResults = await Promise.all(
    categories.map(async (category) => {
      const Product = getProductModel(category);
      const [total, products] = await Promise.all([
        Product.countDocuments(filter),
        Product.find(filter)
          .sort({ createdAt: -1, _id: -1 })
          .limit(page * limit)
          .lean(),
      ]);
      return { category, total, products };
    }),
  );

  const total = collectionResults.reduce((count, result) => count + result.total, 0);
  const data = collectionResults
    .flatMap(({ category, products }) => products.map((product) => toAdminProduct(product, category)))
    .sort((left, right) => {
      const createdDifference = new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
      return createdDifference || String(right._id).localeCompare(String(left._id));
    })
    .slice((page - 1) * limit, page * limit);

  res.json({
    success: true,
    count: total,
    data,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

module.exports = { getAdminProducts };
