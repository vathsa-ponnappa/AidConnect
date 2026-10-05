const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(
  '/uploads',
  express.static('uploads')
);

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/emergencies', emergencyRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'AidConnect backend is running',
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AidConnect backend running on port ${PORT}`);
});