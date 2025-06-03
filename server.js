// server.js  –  TimeGuessr backend (robust version)
const express = require('express');
const path    = require('path');
const fs      = require('fs');
const exifr   = require('exifr');

const app  = express();
const PORT = process.env.PORT || 3000;

const IMAGES_DIR = path.join(__dirname, 'images');

// ───────────────────────────────────────────────────────────
// Serve static assets
// ───────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(IMAGES_DIR));

// ───────────────────────────────────────────────────────────
// Helper: extract metadata safely
// ───────────────────────────────────────────────────────────
async function getImageMetadata(filePath) {
  try {
    // ask exifr for only what we need (gps true → lat/lng)
    const exif = await exifr.parse(filePath, { gps: true });
    if (!exif) throw new Error('No EXIF found');

    // ⬇️ NEW: skip if GPS coords are missing
    if (exif.latitude == null || exif.longitude == null) {
      throw new Error('No GPS');
    }

    return {
      filename: '/images/' + path.basename(filePath),
      timestamp: exif.DateTimeOriginal || null,
      lat: exif.latitude  || null,
      lng: exif.longitude || null,
    };
  } catch (err) {
    console.error(`❌ Error reading ${path.basename(filePath)}: ${err.message}`);
    return null;                      // skip this image
  }
}

// ───────────────────────────────────────────────────────────
// API route  →  /api/images
// ───────────────────────────────────────────────────────────
app.get('/api/images', async (_req, res) => {
  // only *.jpg / *.jpeg / *.png
  const files = fs
    .readdirSync(IMAGES_DIR)
    .filter(f => /\.(jpe?g|png)$/i.test(f));

  const metadata = await Promise.all(
    files.map(f => getImageMetadata(path.join(IMAGES_DIR, f)))
  );

  // Drop any nulls (bad-or-missing EXIF)
  const cleaned = metadata.filter(Boolean);

  // Sort chronologically (oldest → newest)
  cleaned.sort((a, b) =>
    new Date(a.timestamp) - new Date(b.timestamp)
  );

  res.json(cleaned);
});

// ───────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
