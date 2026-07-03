const Criminal = require('../models/Criminal');
const { extractEmbedding, cosineScore } = require('../utils/face');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

const MATCH_THRESHOLD = parseFloat(process.env.MATCH_THRESHOLD || '0.3');

/**
 * Uploads a local file to Cloudinary and returns the secure URL.
 */
function uploadToCloudinary(filePath) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(filePath, (error, result) => {
      if (error) {
        console.error('Cloudinary upload failure:', error);
        return reject(error);
      }
      resolve(result.secure_url);
    });
  });
}

function clampInt(val, defaultValue, minVal, maxVal) {
  const parsed = parseInt(val, 10);
  if (isNaN(parsed)) return defaultValue;
  return Math.max(minVal, Math.min(maxVal, parsed));
}

/**
 * Receives an image, extracts its face embedding via Python sub-process,
 * scans the database for candidate face vectors, filters matches by threshold,
 * and returns the top 5 matches sorted descending.
 */
async function uploadAndMatch(req, res) {
  let tempFilePath = null;
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file' });
    }
    tempFilePath = req.file.path;
    const sexFilter = (req.body.sex_filter || '').trim();

    let emb;
    try {
      emb = await extractEmbedding(tempFilePath);
    } catch (e) {
      return res.status(400).json({ error: e.message || 'Face not detected' });
    }

    if (!emb) {
      return res.status(400).json({ error: 'Face not detected' });
    }

    const docs = await Criminal.findMatchCandidates(sexFilter);
    const results = [];

    for (const doc of docs) {
      if (!doc.embedding) continue;
      try {
        const score = cosineScore(emb, doc.embedding);
        if (score >= MATCH_THRESHOLD) {
          results.push({
            name: doc.name,
            crime: doc.crime,
            imageURL: doc.imageURL,
            score: score
          });
        }
      } catch (e) {
        // Skip exceptions
      }
    }

    results.sort((a, b) => b.score - a.score);
    return res.json({ matches: results.slice(0, 5) });

  } catch (err) {
    console.error('uploadAndMatch error:', err);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (err) {
        console.error('Failed to clean up temp file:', err);
      }
    }
  }
}

/**
 * Enrolls a new criminal: extracts face embedding, uploads profile image to Cloudinary,
 * and creates a DB document with form metadata.
 */
async function enroll(req, res) {
  let tempFilePath = null;
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file' });
    }
    tempFilePath = req.file.path;

    let embedding;
    try {
      embedding = await extractEmbedding(tempFilePath);
    } catch (e) {
      return res.status(400).json({ message: e.message || 'Face not detected' });
    }

    if (!embedding) {
      return res.status(400).json({ message: 'Face not detected' });
    }

    const imageUrl = await uploadToCloudinary(tempFilePath);

    await Criminal.create({
      name: req.body.name,
      age: req.body.age,
      sex: req.body.sex,
      address: req.body.address,
      height: req.body.height,
      weight: req.body.weight,
      crime: req.body.crime,
      status: req.body.status,
      imageURL: imageUrl,
      embedding: embedding
    });

    return res.status(201).json({ message: 'Added' });

  } catch (err) {
    console.error('enroll error:', err);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (err) {
        console.error('Failed to clean up temp file:', err);
      }
    }
  }
}

/**
 * Returns latest enrolled criminals list.
 */
async function latestCriminals(req, res) {
  try {
    const limit = clampInt(req.query.limit, 10, 1, 50);
    const criminals = await Criminal.getLatest(limit);
    return res.json({ criminals });
  } catch (err) {
    console.error('latestCriminals error:', err);
    return res.status(503).json({ message: 'Database not reachable' });
  }
}

/**
 * Searches criminals by name match and optional sex filter.
 */
async function members(req, res) {
  try {
    const name = (req.query.name || '').trim();
    const sex = (req.query.sex || '').trim();
    const limit = clampInt(req.query.limit, 50, 1, 100);

    if (!name) {
      return res.status(400).json({ message: 'Missing name' });
    }

    const results = await Criminal.search({ name, sex, limit });
    return res.json({ members: results });
  } catch (err) {
    console.error('members error:', err);
    return res.status(503).json({ message: 'Database not reachable' });
  }
}

module.exports = {
  uploadAndMatch,
  enroll,
  latestCriminals,
  members
};
