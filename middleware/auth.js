const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const env = require("../config/env");
const { AppError, asyncHandler } = require("./error");

function getSessionToken(cookieHeader = "") {
  const sessionCookie = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("admin_session="));
  return sessionCookie ? sessionCookie.slice("admin_session=".length) : "";
}

const protect = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization || "";
  const [scheme, token] = authorization.split(" ");
  const authToken = scheme === "Bearer" && token ? token : getSessionToken(req.headers.cookie);

  if (!authToken) {
    throw new AppError("Authentication required.", 401);
  }

  let payload;
  try {
    payload = jwt.verify(authToken, env.jwtSecret);
  } catch (error) {
    throw new AppError("Invalid or expired authentication token.", 401);
  }

  const admin = await Admin.findById(payload.id);
  if (!admin || !admin.isActive) {
    throw new AppError("Admin account is not available.", 401);
  }

  req.user = admin;
  next();
});

function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return next(new AppError("Admin access required.", 403));
  }
  return next();
}

module.exports = { protect, adminOnly };
