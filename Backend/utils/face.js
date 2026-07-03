const { execFile } = require("child_process");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

/**
 * Invokes the Python background helper script to extract face embeddings.
 * @param {string} filePath - Absolute path to the uploaded image.
 * @returns {Promise<Array<number>>} - Resolves to the face embedding float array.
 */

function extractEmbedding(filePath) {
  return new Promise((resolve, reject) => {
    const pythonPath = process.env.PYTHON_PATH || "python";
    // Back out from utils/ to root of Backend/ to locate extract_embedding.py
    const scriptPath = path.join(__dirname, "..", "extract_embedding.py");

    execFile(pythonPath, [scriptPath, filePath], (error, stdout, stderr) => {
      if (error) {
        console.error("Python execution error:", error);
        console.error("Python stderr:", stderr);
        return reject(
          new Error(stderr || error.message || "Face detection failed"),
        );
      }
      try {
        const data = JSON.parse(stdout);
        if (data.error) {
          return reject(new Error(data.error));
        }
        resolve(data.embedding);
      } catch (e) {
        console.error("Failed to parse Python JSON output:", stdout);
        reject(new Error("Invalid output format from embedding extractor"));
      }
    });
  });
}

/**
 * Calculates the cosine similarity score between two vector arrays.
 * @param {Array<number>} a
 * @param {Array<number>} b
 * @returns {number} similarity score from -1.0 to 1.0
 */
function cosineScore(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    return 0.0;
  }
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0.0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

module.exports = {
  extractEmbedding,
  cosineScore,
};
