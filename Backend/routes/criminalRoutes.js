const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  uploadAndMatch,
  enroll,
  latestCriminals,
  members
} = require('../controllers/criminalController');
const { requireAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

// Multer storage configuration for temporary files
const tempDir = path.join(__dirname, '..', 'temp_uploads');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}
const upload = multer({ dest: tempDir });

// Route Definitions
router.post('/upload', requireAuth(), upload.single('image'), uploadAndMatch);
router.post('/enroll', requireAuth('ADMIN'), upload.single('image'), enroll);
router.get('/latest-criminals', latestCriminals);
router.get('/members', requireAuth(), members);

module.exports = router;
