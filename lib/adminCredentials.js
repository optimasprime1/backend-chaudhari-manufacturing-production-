const crypto = require('node:crypto');
const { promisify } = require('node:util');

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('base64url');
  const derivedKey = await scrypt(password, salt, KEY_LENGTH, { maxmem: 128 * 1024 * 1024 });
  return `scrypt$${salt}$${Buffer.from(derivedKey).toString('base64url')}`;
}

async function verifyPassword(password, storedHash) {
  const [algorithm, salt, encodedKey] = String(storedHash || '').split('$');
  if (algorithm !== 'scrypt' || !salt || !encodedKey) return false;

  const expected = Buffer.from(encodedKey, 'base64url');
  if (expected.length !== KEY_LENGTH) return false;
  const actual = Buffer.from(await scrypt(password, salt, expected.length, { maxmem: 128 * 1024 * 1024 }));
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

module.exports = { hashPassword, verifyPassword };
