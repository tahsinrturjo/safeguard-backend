const express = require('express');
const router = express.Router();
const User = require('../models/user');

// POST /auth/register
router.post('/register', async (req, res) => {
  const { name, phone, fcmToken } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ phone });

    if (existingUser) {
      // If they exist, just update their token and return their ID
      existingUser.fcmToken = fcmToken;
      await existingUser.save();

      return res.json({
        success: true,
        message: 'Welcome back!',
        userId: existingUser._id
      });
    }

    // Create new user
    const newUser = new User({
      name,
      phone,
      fcmToken
    });

    await newUser.save();

    res.json({
      success: true,
      message: 'Registered successfully!',
      userId: newUser._id
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /auth/update-token
// Called when the app opens, to keep the push token fresh
router.post('/update-token', async (req, res) => {
  const { userId, fcmToken } = req.body;

  try {
    await User.findByIdAndUpdate(userId, { fcmToken });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;