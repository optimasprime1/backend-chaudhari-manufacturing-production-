const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const env = require("../config/env");
const { AppError, asyncHandler } = require("../middleware/error");

function signToken(admin) {
  if (!env.jwtSecret) {
    throw new AppError("JWT_SECRET is not configured in backend/.env.", 500);
  }
  return jwt.sign({ id: admin._id.toString(), role: admin.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

function publicAdmin(admin) {
  return {
    id: admin._id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  };
}

function setAdminSessionCookie(res, token) {
  res.cookie("admin_session", token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/api/admin",
  });
}

const registerAdmin = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password || password.length < 8) {
    throw new AppError("Name, email, and a password of at least 8 characters are required.", 400);
  }

  const existingAdminCount = await Admin.countDocuments();
  if (existingAdminCount > 0) {
    throw new AppError("An admin already exists. Use the existing admin account to manage access.", 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await Admin.create({ name, email, passwordHash });
  const token = signToken(admin);

  res.status(201).json({ success: true, data: { admin: publicAdmin(admin), token } });
});

const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    throw new AppError("Email and password are required.", 400);
  }

  const admin = await Admin.findOne({ email: String(email).toLowerCase() }).select("+passwordHash");
  if (!admin || !admin.isActive || !(await admin.comparePassword(password))) {
    throw new AppError("Invalid email or password.", 401);
  }

  admin.lastLoginAt = new Date();
  await admin.save();
  const token = signToken(admin);
  setAdminSessionCookie(res, token);
  res.json({ success: true, data: { admin: publicAdmin(admin), token } });
});

const logoutAdmin = (req, res) => {
  res.clearCookie("admin_session", {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/api/admin",
  });
  res.json({ success: true, message: "Logged out successfully." });
};

const getCurrentAdmin = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { admin: publicAdmin(req.user) } });
});

module.exports = { registerAdmin, loginAdmin, logoutAdmin, getCurrentAdmin, publicAdmin };
