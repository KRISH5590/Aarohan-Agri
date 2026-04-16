// ============================================
//  AAROHAN AGRI — script.js  (Full Implementation)
// ============================================

let currentTab = 0;
let sensorChart, demandChart, map, routePolyline;
let qrCodeInstance = null;
let blockCount = 14;
let simulationRunning = false;

// ─── Utility ───────────────────────────────
function rand(min, max) { return Math.round(Math.random() * (max - min) + min); }
function randFloat(min, max) { return +(Math.random() * (max - min) + min).toFixed(1); }

// ─── Theme Toggle ───────────────────────────
function toggleTheme() {
  const html = document.documentElement;
  const btn  = document.getElementById('themeToggle');
  if (html.getAttribute('data-theme') === 'dark') {
    html.setAttribute('data-theme', 'light');
    btn.textContent = '☀️';
    if (map) map.invalidateSize();
  } else {
    html.setAttribute('data-theme', 'dark');
    btn.textContent = '☽';
    if (map) map.invalidateSize();
  }
}

// ─── Tab Switching ──────────────────────────
function openTab(n) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab').forEach((btn, i) => {
    btn.classList.toggle('tab-active', i === n);
  });
  document.getElementById('tab' + n).classList.add('active');
  currentTab = n;

  // Init map only when tab 2 is opened (avoids Leaflet sizing bugs)
  if (n === 2 && !map) {
    setTimeout(initMap, 100);
  } else if (n === 2 && map) {
    setTimeout(() => map.invalidateSize(), 100);
  }
  // Init blockchain tab
  if (n === 3 && document.getElementById('blockchainLedger').children.length === 0) {
    renderBlockchain();
  }
}

// ─── Sensor Chart ───────────────────────────
function initSensorChart() {
  const ctx = document.getElementById('sensorChart').getContext('2d');

  const labels = [];
  const tempData = [], humData = [], soilData = [];

  for (let i = 11; i >= 0; i--) {
    const h = new Date();
    h.setHours(h.getHours() - i);
    labels.push(h.getHours() + ':00');
    tempData.push(rand(24, 36));
    humData.push(rand(55, 80));
    soilData.push(rand(40, 65));
  }

  sensorChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Temperature (°C)',
          data: tempData,
          borderColor: '#00ff6a',
          backgroundColor: 'rgba(0,255,106,0.05)',
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 6,
          borderWidth: 2,
        },
        {
          label: 'Humidity (%)',
          data: humData,
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56,189,248,0.05)',
          tension: 0.4,
          fill: false,
          pointRadius: 3,
          pointHoverRadius: 6,
          borderWidth: 2,
        },
        {
          label: 'Soil Moisture (%)',
          data: soilData,
          borderColor: '#fb923c',
          backgroundColor: 'rgba(251,146,60,0.05)',
          tension: 0.4,
          fill: false,
          pointRadius: 3,
          pointHoverRadius: 6,
          borderWidth: 2,
        }
      ]
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#162219',
          borderColor: 'rgba(0,255,106,0.3)',
          borderWidth: 1,
          titleColor: '#e8f5ec',
          bodyColor: '#8db39a',
          padding: 10,
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#4a6b55', font: { family: 'Nunito', size: 11 } }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#4a6b55', font: { family: 'Nunito', size: 11 } }
        }
      }
    }
  });
}

// ─── Demand Chart ───────────────────────────
function initDemandChart() {
  const ctx = document.getElementById('demandChart').getContext('2d');

  const labels = [];
  const wheatData = [], soybeanData = [], maizeData = [];

  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    labels.push(d.getDate() + '/' + (d.getMonth() + 1));
    wheatData.push(rand(2400, 3200));
    soybeanData.push(rand(3800, 4600));
    maizeData.push(rand(1600, 2200));
  }

  demandChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Wheat (₹/q)',
          data: wheatData,
          borderColor: '#00ff6a',
          backgroundColor: 'rgba(0,255,106,0.08)',
          tension: 0.4, fill: true, borderWidth: 2,
          pointRadius: 0, pointHoverRadius: 5,
        },
        {
          label: 'Soybean (₹/q)',
          data: soybeanData,
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56,189,248,0.06)',
          tension: 0.4, fill: false, borderWidth: 2,
          pointRadius: 0, pointHoverRadius: 5,
        },
        {
          label: 'Maize (₹/q)',
          data: maizeData,
          borderColor: '#fb923c',
          backgroundColor: 'rgba(251,146,60,0.06)',
          tension: 0.4, fill: false, borderWidth: 2,
          pointRadius: 0, pointHoverRadius: 5,
        }
      ]
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: { color: '#8db39a', font: { family: 'Nunito', size: 12 }, padding: 20 }
        },
        tooltip: {
          backgroundColor: '#162219',
          borderColor: 'rgba(0,255,106,0.3)',
          borderWidth: 1,
          titleColor: '#e8f5ec',
          bodyColor: '#8db39a',
          padding: 10,
          callbacks: {
            label: ctx => ' ' + ctx.dataset.label + ': ' + ctx.parsed.y.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#4a6b55', font: { size: 10 }, maxRotation: 0, maxTicksLimit: 10 }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            color: '#4a6b55',
            callback: v => '₹' + v.toLocaleString('en-IN')
          }
        }
      }
    }
  });
}

// ─── Sensors Update ─────────────────────────
function updateSensors() {
  const temp  = rand(24, 38);
  const hum   = rand(52, 82);
  const soil  = rand(38, 68);

  // Update values
  document.getElementById('temp').textContent     = temp + '°C';
  document.getElementById('humidity').textContent = hum + '%';
  document.getElementById('soil').textContent     = soil + '%';

  // Update bars
  const pctTemp = Math.min(100, Math.round((temp - 20) / 25 * 100));
  const pctHum  = hum;
  const pctSoil = soil;

  document.getElementById('tempBar').style.width = pctTemp + '%';
  document.getElementById('humBar').style.width  = pctHum  + '%';
  document.getElementById('soilBar').style.width = pctSoil + '%';

  // Flash animation
  ['tempCard', 'humCard', 'soilCard'].forEach(id => {
    const el = document.getElementById(id);
    el.classList.add('sensor-flash');
    setTimeout(() => el.classList.remove('sensor-flash'), 600);
  });

  // Sync to app tab
  const appTemp = document.getElementById('appTemp');
  const appHum  = document.getElementById('appHum');
  const appSoil = document.getElementById('appSoil');
  if (appTemp) appTemp.textContent = temp + '°';
  if (appHum)  appHum.textContent  = hum + '%';
  if (appSoil) appSoil.textContent = soil + '%';

  // Push new point to sensor chart
  if (sensorChart) {
    const now = new Date();
    const label = now.getHours() + ':' + String(now.getMinutes()).padStart(2,'0');
    sensorChart.data.labels.push(label);
    sensorChart.data.labels.shift();
    sensorChart.data.datasets[0].data.push(temp);
    sensorChart.data.datasets[0].data.shift();
    sensorChart.data.datasets[1].data.push(hum);
    sensorChart.data.datasets[1].data.shift();
    sensorChart.data.datasets[2].data.push(soil);
    sensorChart.data.datasets[2].data.shift();
    sensorChart.update('none');
  }
}

// ─── Weather Forecast ───────────────────────
async function fetchWeatherForecast() {
  const container = document.getElementById('weatherContainer');
  container.innerHTML = '<div class="weather-loading">⛅ Fetching forecast for Piparia, MP...</div>';

  try {
    const lat = 22.85, lon = 78.45;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_mean,weathercode&timezone=Asia%2FKolkata`;
    const res  = await fetch(url);
    const data = await res.json();

    const weatherEmoji = code => {
      if (code === 0) return '☀️';
      if (code <= 3)  return '⛅';
      if (code <= 48) return '🌫️';
      if (code <= 57) return '🌧️';
      if (code <= 67) return '🌨️';
      if (code <= 77) return '❄️';
      if (code <= 82) return '🌦️';
      return '⛈️';
    };

    container.innerHTML = '';
    for (let i = 0; i < 5; i++) {
      const d     = new Date(data.daily.time[i]);
      const day   = d.toLocaleDateString('en-US', { weekday: 'short' });
      const date  = d.getDate() + ' ' + d.toLocaleDateString('en-US', { month: 'short' });
      const max   = Math.round(data.daily.temperature_2m_max[i]);
      const min   = Math.round(data.daily.temperature_2m_min[i]);
      const rain  = Math.round(data.daily.precipitation_probability_mean[i]);
      const code  = data.daily.weathercode[i];
      const emoji = weatherEmoji(code);

      const card = document.createElement('div');
      card.className = 'weather-card';
      card.innerHTML = `
        <p class="weather-day">${day}</p>
        <p style="font-size:0.68rem;color:var(--text3);margin-bottom:4px">${date}</p>
        <div class="weather-emoji">${emoji}</div>
        <p class="weather-max">${max}°</p>
        <p class="weather-min">${min}°</p>
        <p class="weather-rain">🌧️ ${rain}%</p>
      `;
      container.appendChild(card);
    }
  } catch (e) {
    // Static fallback
    const days = ['Today','Thu','Fri','Sat','Sun'];
    const icons = ['☀️','⛅','🌦️','☀️','☀️'];
    const maxT  = [34, 36, 32, 31, 33];
    const minT  = [24, 25, 23, 22, 24];
    const rain  = [10,  5, 35, 15,  0];

    container.innerHTML = '';
    days.forEach((day, i) => {
      const card = document.createElement('div');
      card.className = 'weather-card';
      card.innerHTML = `
        <p class="weather-day">${day}</p>
        <div class="weather-emoji">${icons[i]}</div>
        <p class="weather-max">${maxT[i]}°</p>
        <p class="weather-min">${minT[i]}°</p>
        <p class="weather-rain">🌧️ ${rain[i]}%</p>
      `;
      container.appendChild(card);
    });
  }
}

// ─── Leaflet Map ─────────────────────────────
function initMap() {
  const farmLat = 22.849, farmLon = 78.452;
  const storeLat = 22.770, storeLon = 78.352;
  const marketLat = 22.719, marketLon = 75.858;

  map = L.map('map', { zoomControl: true }).setView([22.78, 77.2], 8);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18
  }).addTo(map);

  // Custom icons
  const farmIcon = L.divIcon({
    html: `<div style="background:#00ff6a;width:14px;height:14px;border-radius:50%;border:3px solid #060f09;box-shadow:0 0 12px #00ff6a"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    className: ''
  });

  const storeIcon = L.divIcon({
    html: `<div style="background:#ffb733;width:12px;height:12px;border-radius:50%;border:3px solid #060f09;box-shadow:0 0 10px #ffb733"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    className: ''
  });

  const marketIcon = L.divIcon({
    html: `<div style="background:#38bdf8;width:14px;height:14px;border-radius:50%;border:3px solid #060f09;box-shadow:0 0 12px #38bdf8"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    className: ''
  });

  L.marker([farmLat, farmLon], { icon: farmIcon })
    .addTo(map).bindPopup('<b>🌾 Piparia Farm</b><br>Origin • IoT Active');

  L.marker([storeLat, storeLon], { icon: storeIcon })
    .addTo(map).bindPopup('<b>🏢 Pipariya Cold Storage</b><br>Waypoint • 9:15 AM');

  L.marker([marketLat, marketLon], { icon: marketIcon })
    .addTo(map).bindPopup('<b>🏪 Indore Mandi Market</b><br>Destination • 11:20 AM');

  // Draw route
  routePolyline = L.polyline(
    [[farmLat, farmLon], [storeLat, storeLon], [marketLat, marketLon]],
    { color: '#00ff6a', weight: 3, opacity: 0.8, dashArray: '8 4' }
  ).addTo(map);

  map.fitBounds(routePolyline.getBounds(), { padding: [40, 40] });
}

function optimizeRoute() {
  const dist = rand(148, 165);
  const hrs  = Math.floor((dist / 50) + 1);
  const mins = rand(10, 55);
  const cost = rand(1700, 2100);
  const save = rand(300, 550);

  document.getElementById('routeDist').textContent = dist + ' km';
  document.getElementById('routeTime').textContent = hrs + 'h ' + mins + 'm';
  document.getElementById('routeCost').textContent = '₹' + cost.toLocaleString('en-IN');
  document.getElementById('routeSave').textContent = '₹' + save.toLocaleString('en-IN');

  // Flash route on map
  if (routePolyline) {
    routePolyline.setStyle({ color: '#ffb733' });
    setTimeout(() => routePolyline.setStyle({ color: '#00ff6a' }), 1000);
  }
}

// ─── Blockchain Ledger ──────────────────────
const blockTypes = [
  { title: 'Harvest Recorded',   emoji: '🌾' },
  { title: 'Quality Verified',   emoji: '✅' },
  { title: 'Cold Storage Entry', emoji: '❄️' },
  { title: 'Transport Initiated',emoji: '🚛' },
  { title: 'Mandi Arrival',      emoji: '🏪' },
  { title: 'Sale Completed',     emoji: '💰' },
  { title: 'Payment Settled',    emoji: '📲' },
  { title: 'IoT Data Hash',      emoji: '📡' },
];

function randomHash() {
  return '0x' + Array.from({length:16}, () => Math.floor(Math.random()*16).toString(16)).join('');
}

function renderBlockchain() {
  const ledger = document.getElementById('blockchainLedger');
  ledger.innerHTML = '';

  for (let i = blockCount; i >= Math.max(1, blockCount - 9); i--) {
    const type = blockTypes[i % blockTypes.length];
    const minsAgo = (blockCount - i) * rand(4, 10);
    const timeLabel = minsAgo === 0 ? 'Just now' : minsAgo + 'm ago';

    const item = document.createElement('div');
    item.className = 'block-item';
    item.innerHTML = `
      <div class="block-num">Block #${i}</div>
      <div class="block-info">
        <p class="block-title">${type.emoji} ${type.title}</p>
        <p class="block-hash">${randomHash()}...${randomHash().slice(-8)}</p>
      </div>
      <div class="block-meta">
        <p class="block-time">${timeLabel}</p>
        <p class="block-status">✓ CONFIRMED</p>
      </div>
    `;
    ledger.appendChild(item);
  }
}

function updateBlockchain() {
  blockCount++;
  document.getElementById('blockCount').textContent = blockCount;
  document.getElementById('chainTime').textContent = 'Just now';

  if (currentTab === 3) {
    const type  = blockTypes[blockCount % blockTypes.length];
    const ledger = document.getElementById('blockchainLedger');

    const item = document.createElement('div');
    item.className = 'block-item';
    item.innerHTML = `
      <div class="block-num">Block #${blockCount}</div>
      <div class="block-info">
        <p class="block-title">${type.emoji} ${type.title}</p>
        <p class="block-hash">${randomHash()}...${randomHash().slice(-8)}</p>
      </div>
      <div class="block-meta">
        <p class="block-time">Just now</p>
        <p class="block-status">✓ CONFIRMED</p>
      </div>
    `;

    ledger.insertBefore(item, ledger.firstChild);
    if (ledger.children.length > 10) ledger.removeChild(ledger.lastChild);
  }
}

// ─── Simulate Harvest ───────────────────────
function simulateHarvest() {
  if (simulationRunning) return;
  simulationRunning = true;

  const newTemp  = rand(26, 36);
  const newHum   = rand(55, 80);
  const newSoil  = rand(40, 70);
  const yieldKg  = rand(1200, 2400);
  const price    = rand(2600, 3200);
  const moisture = randFloat(12, 17);

  // Update sensors
  document.getElementById('temp').textContent     = newTemp + '°C';
  document.getElementById('humidity').textContent = newHum + '%';
  document.getElementById('soil').textContent     = newSoil + '%';
  document.getElementById('tempBar').style.width  = Math.min(100, Math.round((newTemp - 20) / 25 * 100)) + '%';
  document.getElementById('humBar').style.width   = newHum + '%';
  document.getElementById('soilBar').style.width  = newSoil + '%';

  // Add a blockchain block
  updateBlockchain();

  // Show simulate modal
  const simResults = document.getElementById('simResults');
  simResults.innerHTML = `
    <div class="sim-row"><span>🌡️ Temperature</span><span>${newTemp}°C</span></div>
    <div class="sim-row"><span>💧 Humidity</span><span>${newHum}%</span></div>
    <div class="sim-row"><span>🌱 Soil Moisture</span><span>${newSoil}%</span></div>
    <div class="sim-row"><span>⚖️ Estimated Yield</span><span>${yieldKg.toLocaleString('en-IN')} kg</span></div>
    <div class="sim-row"><span>💰 Market Price</span><span>₹${price}/q</span></div>
    <div class="sim-row"><span>🌾 Grain Moisture</span><span>${moisture}%</span></div>
    <div class="sim-row"><span>🔗 Block Added</span><span>#${blockCount}</span></div>
  `;
  document.getElementById('simulateModal').classList.remove('hidden');

  simulationRunning = false;
}

function hideSimulateModal() {
  document.getElementById('simulateModal').classList.add('hidden');
}

// ─── QR Code ─────────────────────────────────
function showQRModal() {
  const modal = document.getElementById('qrModal');
  modal.classList.remove('hidden');

  if (!qrCodeInstance) {
    document.getElementById('qrcode').innerHTML = '';
    qrCodeInstance = new QRCode(document.getElementById('qrcode'), {
      text: 'https://aarohan-agri.vercel.app',
      width: 200,
      height: 200,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });
  }
}

function hideQRModal() {
  document.getElementById('qrModal').classList.add('hidden');
}

// Close modals on overlay click
document.addEventListener('click', e => {
  if (e.target.id === 'qrModal')       hideQRModal();
  if (e.target.id === 'simulateModal') hideSimulateModal();
});

// Close modals on Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { hideQRModal(); hideSimulateModal(); }
});

// ─── App Clock ───────────────────────────────
function updateAppTime() {
  const el = document.getElementById('appTime');
  if (el) {
    const now = new Date();
    el.textContent = now.getHours() + ':' + String(now.getMinutes()).padStart(2,'0');
  }
}

// ─── Init ────────────────────────────────────
window.onload = function () {
  initSensorChart();
  initDemandChart();
  fetchWeatherForecast();
  renderBlockchain();
  updateSensors();
  updateAppTime();
  openTab(0);

  // Auto-update intervals
  setInterval(updateSensors,    8000);
  setInterval(updateBlockchain, 30000);
  setInterval(updateAppTime,    10000);
};