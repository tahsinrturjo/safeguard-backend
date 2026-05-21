const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  phone: { type: String, unique: true },
  fcmToken: String,
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  lastSeen: { type: Date, default: Date.now }
});

userSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', userSchema);