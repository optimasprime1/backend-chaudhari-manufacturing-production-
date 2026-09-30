const path = require("node:path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });
dotenv.config({ path: path.resolve(__dirname, "..", "admin.env") });

const csv = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

module.exports = {
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET || process.env.ADMIN_SESSION_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  isProduction: process.env.NODE_ENV === "production",
  frontendOrigins: csv(process.env.FRONTEND_ORIGINS),
  allowFileOrigin: process.env.ALLOW_FILE_ORIGIN === "true",
  frontendDir: process.env.FRONTEND_DIR
    ? path.resolve(__dirname, "..", process.env.FRONTEND_DIR)
    : null,
};
