const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const secretKey = process.env.FLASK_SECRET_KEY || 'dev';

/**
 * Middleware to enforce JWT token presence and option role verification.
 * @param {string|null} requiredRole - Optional role requirement (e.g. 'ADMIN')
 */
function requireAuth(requiredRole = null) {
  return (req, res, next) => {
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    const authHeader = req.headers['authorization'] || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing token' });
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        return res.status(401).json({
          message: err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token'
        });
      }

      if (requiredRole && decoded.role !== requiredRole) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      req.user = decoded;
      next();
    });
  };
}

module.exports = {
  requireAuth
};
