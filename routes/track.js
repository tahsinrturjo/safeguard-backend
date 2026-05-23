const express = require('express');
const router = express.Router();
const User = require('../models/user');

// GET /track/:userId - Live tracking page
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).send('User not found');

    const [longitude, latitude] = user.location.coordinates;

    res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>🚨 Safeguard - Live Location</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: sans-serif; background: #0d1b2a; color: white; }
    #header {
      padding: 16px;
      background: #e63946;
      text-align: center;
      font-size: 16px;
      font-weight: bold;
    }
    #status {
      padding: 10px;
      text-align: center;
      font-size: 13px;
      color: #7dd3fc;
      background: #1e1e2e;
    }
    #map { width: 100%; height: calc(100vh - 90px); }
  </style>
</head>
<body>
  <div id="header">🚨 LIVE LOCATION — ${user.name}</div>
  <div id="status">Updating every 10 seconds...</div>
  <div id="map"></div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const userId = '${userId}';

    const map = L.map('map').setView([${latitude}, ${longitude}], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const marker = L.marker([${latitude}, ${longitude}])
      .addTo(map)
      .bindPopup('🚨 ${user.name}')
      .openPopup();

    async function updateLocation() {
      try {
        const res = await fetch('/track/location/' + userId);
        const data = await res.json();
        if (data.latitude && data.longitude) {
          const pos = [data.latitude, data.longitude];
          marker.setLatLng(pos);
          map.panTo(pos);
          document.getElementById('status').textContent =
            'Last updated: ' + new Date().toLocaleTimeString();
        }
      } catch (e) {
        document.getElementById('status').textContent = 'Connection lost...';
      }
    }

    setInterval(updateLocation, 10000);
  </script>
</body>
</html>
    `);
  } catch (e) {
    res.status(500).send('Error loading tracking page');
  }
});

// GET /track/location/:userId - Returns latest coordinates as JSON
router.get('/location/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: 'Not found' });
    const [longitude, latitude] = user.location.coordinates;
    res.json({ latitude, longitude });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;