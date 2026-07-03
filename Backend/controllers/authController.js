const User = require('../models/User');
const { checkPassword, hashPassword } = require('../utils/password');
const jwt = require('jsonwebtoken');

const secretKey = process.env.FLASK_SECRET_KEY || 'dev';

/**
 * Handles user sign-up requests.
 */
async function signup(req, res) {
  try {
    const { name, email, password, role: requestedRole, adminSecret } = req.body;

    const normalizedName = (name || '').trim();
    const rawEmail = (email || '').trim();
    const normalizedEmail = rawEmail.toLowerCase();
    const cleanRole = (requestedRole || 'NORMAL').trim().toUpperCase();
    const cleanAdminSecret = (adminSecret || '').trim();

    if (!normalizedName || !normalizedEmail || !password || typeof password !== 'string') {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    let role = 'NORMAL';
    if (cleanRole === 'ADMIN') {
      const expectedSecret = (process.env.ADMIN_SECRET_KEY || '').trim();
      if (!expectedSecret || cleanAdminSecret !== expectedSecret) {
        return res.status(403).json({ message: 'Invalid admin secret' });
      }
      role = 'ADMIN';
    }

    const existingUser = await User.findByEmail(rawEmail);

    if (existingUser) {
      return res.status(409).json({ message: 'User exists' });
    }

    await User.create({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      role: role
    });

    return res.status(201).json({ message: 'Signup successful' });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

/**
 * Handles user login requests, checks credentials and generates JWTs.
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    const rawEmail = (email || '').trim();
    const normalizedEmail = rawEmail.toLowerCase();

    if (!normalizedEmail || !password || typeof password !== 'string') {
      return res.status(400).json({ message: 'Missing email or password' });
    }

    const user = await User.findByEmail(rawEmail);
    const storedHash = user ? (user.passwordHash || user.password_hash || user.password) : null;

    if (!user || !storedHash || !checkPassword(storedHash, password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const role = user.role || 'NORMAL';
    const token = jwt.sign(
      { email: user.email || normalizedEmail, role: role },
      secretKey,
      { expiresIn: '7d' } // Match Python 7-day token expiration
    );

    return res.json({
      token: token,
      user: {
        email: user.email || normalizedEmail,
        name: user.name,
        role: role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  signup,
  login
};
