/***** EmmaGuessr – v2 : responsive frame + 5-image random game *****/
let allImages = [], gameImages = [];
let idx = 0, score = 0;
let guessedLat = null, guessedLng = null, marker = null;

const photo   = document.getElementById('photo');
const scoreEl = document.getElementById('score');
const result  = document.getElementById('result');
const submit  = document.getElementById('submitBtn');

/* ─── helper UI updaters ────────────────────────── */
const updateYearLabel  = v => (document.getElementById('yearLabel').textContent = v);
const updateMonthLabel = v => (document.getElementById('monthLabel').textContent = v);
const setScore         = () => (scoreEl.textContent = `Score : ${score}`);

/* ─── Leaflet map ───────────────────────────────── */
const map = L.map('map').setView([20,0],2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  {attribution:'© OpenStreetMap'}).addTo(map);
map.on('click', e=>{
  guessedLat = e.latlng.lat; guessedLng = e.latlng.lng;
  if(marker) map.removeLayer(marker);
  marker = L.marker([guessedLat,guessedLng]).addTo(map);
});

/* ─── distance helper ───────────────────────────── */
const haversine = ([aLat,aLon],[bLat,bLon])=>{
  const R=6371,rad=x=>x*Math.PI/180;
  const dLat=rad(bLat-aLat), dLon=rad(bLon-aLon);
  const a=Math.sin(dLat/2)**2+Math.cos(rad(aLat))*Math.cos(rad(bLat))*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
};

/* ─── load next photo ───────────────────────────── */
function nextImage(){
  guessedLat=guessedLng=null; if(marker)map.removeLayer(marker);

  if(idx >= gameImages.length){ showFinal(); return; }

  const img = gameImages[idx];
  photo.src = img.filename;
  photo.onload = () => {
    /* auto-scale container width for tall vs wide pics */
    const container = photo.parentElement;
  };

  result.textContent = '';
  submit.disabled = false;
  document.getElementById('year').value  = 2015; updateYearLabel(2015);
  document.getElementById('month').value = 7;    updateMonthLabel(7);
}

/* ─── handle guess ─────────────────────────────── */
function checkGuess(){
  submit.disabled = true;

  const img = gameImages[idx];
  const gYear  = +document.getElementById('year').value;
  const gMonth = +document.getElementById('month').value;

  const real = new Date(img.timestamp);
  const rYear = real.getFullYear(), rMonth = real.getMonth()+1;

  const mErr = Math.abs(rYear*12 + rMonth - (gYear*12 + gMonth));
  const datePts = Math.max(0, 100 - mErr);

  let res = `📅 Date error: ${mErr} mo`;
  let locPts = 0;

  if(guessedLat!=null){
    const dist = Math.round(haversine([img.lat,img.lng],[guessedLat,guessedLng]));
    locPts = Math.max(0, 100 - dist);
    res += `\n📍 Distance: ${dist} km`;
  }else res += `\n📍 No click`;

  score += datePts + locPts; setScore();
  result.textContent = res;

  idx++;
  setTimeout(nextImage, 1800);
}

/* ─── final screen ─────────────────────────────── */
function showFinal(){
  // hide map + submit button
  document.getElementById('mapWrapper').remove();
  submit.remove();

  const max = gameImages.length * 200;
  const pct = score / max;

  // Grade logic
  let grade = 'GreatScore';
  let message = ' Yupeee Great Job, I love you pooks <3 ';

  if (pct < 0.25) {
    grade = 'BadScore';
    message = '  Cmon pooks Get A Grip :( ';
  } else if (pct < 0.5) {
    grade = 'OkScore';
    message = ' Not too bad, still love you pooks  ';
  } else if (pct < 0.75) {
    grade = 'GoodScore';
    message = ' What the Flippity Flip, That was kinda good yo ';
  }

  // Show grade image
  const wrapper = document.querySelector('.photo-container');
  wrapper.innerHTML = `<img src="/images/${grade}.jpg" alt="${grade}">`;

  // Show final result
  result.innerHTML = `
    <h2>Game Over!</h2>
    <p>Your score: <strong>${score}</strong> / ${max}</p>
    <p style="margin-top:12px">${message}</p>
  `;
}



/* ─── shuffle helper ───────────────────────────── */
function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
}

/* ─── startup: fetch + init ────────────────────── */
fetch('/api/images')
  .then(r=>r.json())
  .then(data=>{
    allImages = data;
    shuffle(allImages);
    gameImages = allImages.slice(0,5);   // 5-image game
    setScore();
    nextImage();
  })
  .catch(e=>{
    console.error(e);
    alert('Failed to load images');
  });

/* ─── map expand / collapse (unchanged) ────────── */
document.addEventListener('DOMContentLoaded',()=>{
  const wrap=document.getElementById('mapWrapper');
  const btn =document.getElementById('toggleMap');
  btn.addEventListener('click',()=>{
    wrap.classList.toggle('expanded');
    btn.textContent = wrap.classList.contains('expanded')?'Collapse Map':'Expand Map';
    setTimeout(()=>map.invalidateSize(),320);
  });
});
