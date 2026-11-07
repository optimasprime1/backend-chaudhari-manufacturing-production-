const crypto = require('node:crypto');
const { getSessionAdmin } = require('../lib/adminSession');

async function requireAdmin(req, res, next) {
  try {
    const admin = await getSessionAdmin(req);
    if (admin) {
      req.admin = admin;
      return next();
    }

    const expected = process.env.ADMIN_API_KEY;
    const provided = req.get('x-admin-api-key') || '';
    if (expected) {
      const expectedBuffer = Buffer.from(expected);
      const providedBuffer = Buffer.from(provided);
      const valid = expectedBuffer.length === providedBuffer.length
        && crypto.timingSafeEqual(expectedBuffer, providedBuffer);
      if (valid) return next();
    }

    return res.status(401).json({ success: false, message: 'Authentication required.' });
  } catch (error) {
    return next(error);
  }
}

module.exports = { requireAdmin };
