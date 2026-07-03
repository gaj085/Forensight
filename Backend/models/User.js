const { getUsersCollection } = require('../configs/db');

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

class User {
  /**
   * Finds a user by email using case-insensitive search.
   * @param {string} email 
   * @returns {Promise<Object|null>}
   */
  static async findByEmail(email) {
    const coll = getUsersCollection();
    const cleanEmail = (email || '').trim().toLowerCase();
    
    // Attempt fast exact match on lowercase email
    let user = await coll.findOne({ email: cleanEmail });
    if (!user) {
      // Fallback: search case-insensitive regexp if needed
      user = await coll.findOne({
        email: new RegExp(`^${escapeRegExp((email || '').trim())}$`, 'i')
      });
    }
    return user;
  }

  /**
   * Creates a new user record.
   * @param {Object} userData 
   * @param {string} userData.name
   * @param {string} userData.email
   * @param {string} userData.passwordHash
   * @param {string} userData.role
   */
  static async create({ name, email, passwordHash, role }) {
    const coll = getUsersCollection();
    const result = await coll.insertOne({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: (role || 'NORMAL').toUpperCase(),
      createdAt: new Date()
    });
    return result;
  }
}

module.exports = User;
