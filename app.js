const express = require("express");
const path = require("node:path");
const cors = require("cors");
const env = require("./config/env");
const { getDatabaseStatus } = require("./db");
const { AppError, notFound, errorHandler } = require("./middleware/error");
const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const publicRoutes = require("./routes/publicRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { createEnquiry } = require("./controllers/publicController");

const app = express();

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (env.frontendOrigins.includes(origin)) return true;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  return env.allowFileOrigin && origin === "null";
}

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new AppError("CORS origin is not allowed.", 403));
    },
  }),
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "API is running", database: getDatabaseStatus() });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/public", publicRoutes);
app.post("/api/enquiries", createEnquiry);
app.use("/api/admin", adminRoutes);

if (env.frontendDir) {
  app.use(express.static(env.frontendDir));
  app.get("/admin/*", (req, res, next) => {
    res.sendFile(path.join(env.frontendDir, "admin", "index.html"), (error) => {
      if (error) next(error);
    });
  });
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
