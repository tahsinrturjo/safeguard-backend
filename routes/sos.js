const express = require('express');
const router = express.Router();
const User = require('../models/user');

// POST /sos/trigger
router.post('/trigger', async (req, res) => {
  const { userId, latitude, longitude } = req.body;

  try {
    await User.findByIdAndUpdate(userId, {
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      }
    });

    const nearbyUsers = await User.find({
      _id: { $ne: userId },
      location: {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: 2000
        }
      }
    });

    const tokens = nearbyUsers
      .map(user => user.fcmToken)
      .filter(token => token && token !== 'test-token-123' && token !== 'no-token');

    if (tokens.length > 0) {
      const messages = tokens.map(token => ({
        to: token,
        title: '🚨 SAFETY ALERT NEARBY',
        body: `Someone near you needs help! Open Maps: https://maps.google.com/?q=${latitude},${longitude}`,
        data: {
          latitude: String(latitude),
          longitude: String(longitude),
          mapsUrl: `https://maps.google.com/?q=${latitude},${longitude}`,
          type: 'SOS'
        },
        sound: 'default',
        priority: 'high',
      }));

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messages),
      });

      const result = await response.json();
      console.log('Expo push response:', JSON.stringify(result));
    }

    res.json({
      success: true,
      nearbyUsersFound: nearbyUsers.length,
      notificationsSent: tokens.length
    });

  } catch (error) {
    console.error('SOS error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /sos/update-location
router.post('/update-location', async (req, res) => {
  const { userId, latitude, longitude } = req.body;

  try {
    await User.findByIdAndUpdate(userId, {
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      },
      lastSeen: new Date()
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;