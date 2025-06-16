

//****generate token properly*****

const express = require('express');
const router = express.Router();
const { generateToken } = require('../controllers/videoController'); 

// GET /api/generate-token (used by frontend)
router.get('/generate-token', (req, res) => {
  const { channelName, userId } = req.query;

  if (!channelName || !userId) {
    return res.status(400).json({ error: 'channelName and userId are required' });
  }

  try {
    const token = generateToken(channelName, parseInt(userId));
    res.json({
      token,
      appId: process.env.AGORA_APP_ID,
    });
  } catch (err) {
    console.error('Token generation error:', err);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// POST /api/token (for Postman )
router.post('/token', (req, res) => {
  const { channelName, userId } = req.body;

  if (!channelName || userId === undefined) {
    return res.status(400).json({ error: 'channelName and userId are required' });
  }

  try {
    const token = generateToken(channelName, parseInt(userId));
    res.json({
      token,
      appId: process.env.AGORA_APP_ID,
    });
  } catch (err) {
    console.error('Token generation error:', err);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

module.exports = router;
