let images = [];
let currentIndex = 0;
let guessedLat = null;
let guessedLng = null;
let marker = null;
let score = 0;   // ← your running score

const photo = document.getElementById("photo");
const resultDiv = document.getElementById("result");

// Update the visible score box
function updateScoreDisplay() {
  document.getElementById("score").innerText = `Score: ${score}`;
}

// --- Sliders ---
function updateYearLabel(val) {
  document.getElementById("yearLabel").innerText = val;
}
function updateMonthLabel(val) {
  document.getElementById("monthLabel").innerText = val;
}

// --- Leaflet Map ---
const map = L.map("map").setView([20, 0], 2);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors"
}).addTo(map);

map.on("click", e => {
  guessedLat = e.latlng.lat;
  guessedLng = e.latlng.lng;
  if (marker) map.removeLayer(marker);
  marker = L.marker([guessedLat, guessedLng]).addTo(map);
});

// --- Haversine Formula ---
function haversineDistance(coord1, coord2) {
  const R = 6371;
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(coord2[0] - coord1[0]);
  const dLon = toRad(coord2[1] - coord1[1]);
  const a = Math.sin(dLat/2)**2 +
    Math.cos(toRad(coord1[0])) * Math.cos(toRad(coord2[0])) *
    Math.sin(dLon/2)**2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// --- Game Logic ---
function loadNextImage() {
  guessedLat = guessedLng = null;
  if (marker) map.removeLayer(marker);

  if (currentIndex >= images.length) {
    photo.style.display = "none";
    resultDiv.innerText = "🎉 You've finished all the photos!";
    return;
  }

  const img = images[currentIndex];
  photo.src = img.filename;
  resultDiv.innerText = "";

  // reset sliders
  document.getElementById("year").value = 2015;
  document.getElementById("month").value = 7;
  updateYearLabel(2015);
  updateMonthLabel(7);
}

function checkGuess() {
  const guessedYear  = +document.getElementById("year").value;
  const guessedMonth = +document.getElementById("month").value;

  const img = images[currentIndex];
  const actualDate  = new Date(img.timestamp);
  const actualYear  = actualDate.getFullYear();
  const actualMonth = actualDate.getMonth() + 1;

  // Date error in months
  const monthError = Math.abs((actualYear*12 + actualMonth) - (guessedYear*12 + guessedMonth));
  // Points for date
  const datePoints = Math.max(0, 100 - monthError);

  let result = `📅 Date Error: ${monthError} month(s)\nActual: ${actualYear}-${actualMonth}`;

  // Location error
  let locationPoints = 0;
  if (guessedLat != null && img.lat && img.lng) {
    const dist = haversineDistance([img.lat, img.lng], [guessedLat, guessedLng]);
    const distError = Math.round(dist);
    locationPoints = Math.max(0, 100 - distError);
    result += `\n📍 Location Error: ${distError} km`;
  } else {
    result += `\n📍 No location guessed`;
  }

  // Update score
  score += datePoints + locationPoints;
  updateScoreDisplay();

  resultDiv.innerText = result;
  currentIndex++;
  setTimeout(loadNextImage, 2500);
}

// --- Startup: fetch images & kickoff ---
fetch("/api/images")
  .then(r => r.json())
  .then(data => {
    images = data;
    updateScoreDisplay();
    loadNextImage();
  })
  .catch(err => {
    resultDiv.innerText = "❌ Failed to load images.";
    console.error(err);
  });
