const crypto = require('node:crypto');
const Admin = require('../models/admin');

const COOKIE_NAME = 'cm_admin_session';
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;

function sessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    const error = new Error('Admin authentication is not configured.');
    error.statusCode = 503;
    throw error;
  }
  return secret;
}

function encode(value) {
  return Buffer.from(value).toString('base64url');
}

function sign(value) {
  return crypto.createHmac('sha256', sessionSecret()).update(value).digest('base64url');
}

function createSessionToken(admin) {
  const payload = encode(JSON.stringify({
    sub: String(admin._id),
    exp: Date.now() + SESSION_DURATION_MS,
    ver: admin.passwordChangedAt ? admin.passwordChangedAt.getTime() : 0
  }));
  return `${payload}.${sign(payload)}`;
}

function readCookie(req, name) {
  const cookies = req.headers.cookie || '';
  const pair = cookies.split(';').map(value => value.trim()).find(value => value.startsWith(`${name}=`));
  if (!pair) return '';
  try {
    return decodeURIComponent(pair.slice(name.length + 1));
  } catch {
    return '';
  }
}

async function getSessionAdmin(req) {
  const token = readCookie(req, COOKIE_NAME);
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return null;

  const expected = Buffer.from(sign(payload));
  const supplied = Buffer.from(signature);
  if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) return null;

  let claims;
  try {
    claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  if (!claims.sub || !Number.isFinite(claims.exp) || claims.exp <= Date.now()) return null;
  const admin = await Admin.findById(claims.sub).lean();
  if (!admin || !admin.isActive) return null;
  const passwordVersion = admin.passwordChangedAt ? new Date(admin.passwordChangedAt).getTime() : 0;
  if (claims.ver !== passwordVersion) return null;
  return admin;
}

function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/api',
    maxAge: SESSION_DURATION_MS
  };
}

module.exports = { COOKIE_NAME, SESSION_DURATION_MS, createSessionToken, getSessionAdmin, sessionCookieOptions };
