const express = require('express');
const router = express.Router();
const User = require('../models/user');
const admin = require('firebase-admin');

// Set up Firebase (only once)
if (!admin.apps.length) {
  admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  )
});
}

// POST /sos/trigger
router.post('/trigger', async (req, res) => {
  const { userId, latitude, longitude } = req.body;

  try {
    // Update this user's location
    await User.findByIdAndUpdate(userId, {
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      }
    });

    // Find nearby users within 2km
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

    // Collect push tokens
    const tokens = nearbyUsers
      .map(user => user.fcmToken)
      .filter(token => token && token !== 'test-token-123');

    // Send push notifications if real tokens exist
    if (tokens.length > 0) {
      await admin.messaging().sendEachForMulticast({
        tokens: tokens,
        notification: {
          title: '🚨 SAFETY ALERT NEARBY',
          body: 'Someone near you needs help! Tap to see location.'
        },
        data: {
          latitude: String(latitude),
          longitude: String(longitude),
          type: 'SOS'
        },
        android: {
          priority: 'high'
        },
        apns: {
          payload: {
            aps: {
              'content-available': 1,
              sound: 'default'
            }
          }
        }
      });
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