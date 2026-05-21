const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to database
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Database connected!'))
  .catch(err => console.log('Database error:', err));

// Load routes
const sosRoutes = require('./routes/sos');
app.use('/sos', sosRoutes);

const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

// Basic test
app.get('/', (req, res) => {
  res.send('Safeguard backend is running!');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});