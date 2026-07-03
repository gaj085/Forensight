const { getCriminalsCollection } = require('../configs/db');

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

class Criminal {
  /**
   * Retrieves all criminals containing embeddings, optionally filtered by sex.
   * Used for performing cosine similarity matches.
   * @param {string|null} sexFilter 
   * @returns {Promise<Array<Object>>}
   */
  static async findMatchCandidates(sexFilter = null) {
    const coll = getCriminalsCollection();
    const query = { embedding: { $exists: true } };
    if (sexFilter) {
      query.sex = new RegExp(`^${escapeRegExp(sexFilter)}$`, 'i');
    }
    return coll.find(query, {
      projection: { _id: 0, name: 1, crime: 1, imageURL: 1, sex: 1, embedding: 1 }
    }).toArray();
  }

  /**
   * Registers a new criminal entry in the database.
   * @param {Object} data - Criminal data fields.
   */
  static async create(data) {
    const coll = getCriminalsCollection();
    const doc = {
      name: data.name,
      age: parseInt(data.age, 10) || null,
      sex: data.sex,
      address: data.address,
      height: data.height,
      weight: data.weight,
      crime: data.crime,
      status: data.status,
      imageURL: data.imageURL,
      embedding: data.embedding,
      createdAt: new Date()
    };
    return coll.insertOne(doc);
  }

  /**
   * Retrieves latest enrolled criminals, excluding ID and embedding values.
   * @param {number} limit 
   * @returns {Promise<Array<Object>>}
   */
  static async getLatest(limit) {
    const coll = getCriminalsCollection();
    return coll.find({}, { projection: { _id: 0, embedding: 0 } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }

  /**
   * Searches members/criminals based on name query (regex) and optional sex filter.
   * @param {Object} searchParams
   * @param {string} searchParams.name
   * @param {string} [searchParams.sex]
   * @param {number} searchParams.limit
   * @returns {Promise<Array<Object>>}
   */
  static async search({ name, sex, limit }) {
    const coll = getCriminalsCollection();
    const query = { name: new RegExp(escapeRegExp(name), 'i') };
    if (sex) {
      query.sex = new RegExp(`^${escapeRegExp(sex)}$`, 'i');
    }
    return coll.find(query, { projection: { _id: 0, embedding: 0 } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }
}

module.exports = Criminal;
