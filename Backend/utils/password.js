const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * Checks if a password matches a hash. Supports both Node-standard bcrypt hashes
 * and Werkzeug format hashes (e.g. pbkdf2:sha256 or scrypt).
 */
function checkPassword(storedHash, password) {
  if (!storedHash || !password) return false;

  // 1. Check if standard bcrypt hash
  if (storedHash.startsWith('$2')) {
    try {
      return bcrypt.compareSync(password, storedHash);
    } catch (e) {
      return false;
    }
  }

  // 2. Parse Werkzeug Python hash format: method:iterations:salt$hash or method:salt$hash
  if (storedHash.includes('$')) {
    const parts = storedHash.split('$');
    if (parts.length === 3) {
      const prefix = parts[0]; // e.g. "pbkdf2:sha256:260000" or "scrypt:16384:8:1"
      const salt = parts[1];
      const hash = parts[2];

      const prefixParts = prefix.split(':');
      const methodType = prefixParts[0];

      if (methodType === 'pbkdf2') {
        const algo = prefixParts[1] || 'sha256';
        let iterations = 150000;
        if (prefixParts.length > 2) {
          iterations = parseInt(prefixParts[2], 10);
        }

        // Python's Werkzeug pbkdf2 stores the output as a hexadecimal digest
        const computedHash = crypto.pbkdf2Sync(
          password,
          salt,
          iterations,
          hash.length / 2,
          algo
        ).toString('hex');

        return computedHash === hash;
      } else if (methodType === 'scrypt') {
        let N = 16384;
        let r = 8;
        let p = 1;
        if (prefixParts.length >= 4) {
          N = parseInt(prefixParts[1], 10);
          r = parseInt(prefixParts[2], 10);
          p = parseInt(prefixParts[3], 10);
        }
        const keylen = hash.length / 2;
        const computedHash = crypto.scryptSync(
          password,
          salt,
          keylen,
          { N, r, p }
        ).toString('hex');

        return computedHash === hash;
      }
    }
  }

  // Fallback
  return storedHash === password;
}

/**
 * Hashes a plaintext password using bcryptjs.
 */
function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

module.exports = {
  checkPassword,
  hashPassword
};
