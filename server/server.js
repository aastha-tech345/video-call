

//working..

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./models/db');
const videoRoutes = require('./routes/videoRoutes');

console.log('Environment Variables:', {
  AGORA_APP_ID: process.env.AGORA_APP_ID,
  AGORA_APP_CERTIFICATE: process.env.AGORA_APP_CERTIFICATE,
  PORT: process.env.PORT,
  SEQUELIZE_DATABASE: process.env.SEQUELIZE_DATABASE,
});

const app = express();

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3001',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

// JSON parsing with error handling
app.use((req, res, next) => {
  if (req.method === 'GET' || req.headers['content-type'] !== 'application/json') {
    return next(); // Skip JSON parsing for GET or non-JSON requests
  }
  express.json()(req, res, (err) => {
    if (err) {
      console.error('JSON parsing error:', err);
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
    next();
  });
});

app.use('/api', videoRoutes);

// Test route
app.get('/test', (req, res) => res.json({ message: 'Server is running' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: false });
    console.log('Database connected and synchronized');
  } catch (err) {
    console.error('Database error:', err);
  }
});