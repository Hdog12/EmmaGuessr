// server.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const exifr = require('exifr');
const app = express();
const PORT = 3000;

const IMAGES_DIR = path.join(__dirname, 'images');

// Serve static files (frontend and images)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(IMAGES_DIR));

// Helper to extract metadata
async function getImageMetadata(filename) {
  const filepath = path.join(IMAGES_DIR, filename);
  try {
    const data = await exifr.parse(filepath, ['DateTimeOriginal', 'latitude', 'longitude']);
    return {
      filename: `/images/${filename}`,
      timestamp: data.DateTimeOriginal || null,
      lat: data.latitude || null,
      lng: data.longitude || null
    };
  } catch (err) {
    console.error(`Error reading ${filename}:`, err);
    return null;
  }
}

// Route to get metadata for all images
app.get('/api/images', async (req, res) => {
  const files = fs.readdirSync(IMAGES_DIR).filter(f => /\.(jpe?g|png)$/i.test(f));
  const metadataList = await Promise.all(files.map(getImageMetadata));
  const filtered = metadataList.filter(meta => meta && meta.timestamp);
  filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  res.json(filtered);
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
