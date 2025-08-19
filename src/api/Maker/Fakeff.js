const express = require('express');
const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');
const router = express.Router();

// Background image list
const backgroundList = [
  'https://files.catbox.moe/jbd23e.jpg',
  'https://files.catbox.moe/7fja3z.jpg',
  'https://files.catbox.moe/8j0asj.jpg',
  // ... (all other backgrounds from your list)
];

// Font URL
const FONT_URL = 'https://files.cloudkuimages.guru/fonts/vF3tpPDf.ttf';

// API Endpoint
router.get('/api/fakeff', async (req, res) => {
  try {
    const { nickname, background } = req.query;

    // Validate input
    if (!nickname) {
      return res.status(400).json({
        status: false,
        error: 'Nickname parameter is required'
      });
    }

    // Select background
    const max = backgroundList.length;
    const bgIndex = background 
      ? (isNaN(background) || background < 1 || background > max 
         ? Math.floor(Math.random() * max) 
         : parseInt(background) - 1)
      : Math.floor(Math.random() * max);

    // Download font
    const fontResponse = await axios.get(FONT_URL, { responseType: 'arraybuffer' });
    const fontBuffer = Buffer.from(fontResponse.data);

    // Load background image
    const bg = await loadImage(backgroundList[bgIndex]);
    const canvas = createCanvas(bg.width, bg.height);
    const ctx = canvas.getContext('2d');

    // Draw image
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
    
    // Set font and text
    ctx.font = `bold 33px "${fontBuffer.toString('base64')}"`;
    ctx.fillStyle = '#ffb300';
    ctx.textAlign = 'center';
    ctx.fillText(nickname, 355, canvas.height - 250);

    // Convert to buffer and send
    const imageBuffer = canvas.toBuffer('image/jpeg');
    
    res.set('Content-Type', 'image/jpeg');
    res.send(imageBuffer);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      status: false,
      error: 'Failed to generate image',
      message: error.message
    });
  }
});

// API Documentation
router.get('/api/Maker/fakeff/docs', (req, res) => {
  res.json({
    name: "Fake Free Fire Lobby",
    desc: "Generate custom Free Fire lobby images",
    path: "/api/fakeff?nickname=[NAME]&background=[OPTIONAL_BG_NUMBER]",
    status: "ready",
    params: {
      nickname: "Player nickname (required)",
      background: "Background number (1-16, optional)"
    },
    example: {
      request: "/api/fakeff?nickname=タカシ&background=5",
      response: "Returns JPEG image"
    },
    backgrounds: backgroundList.map((url, index) => ({
      number: index + 1,
      url: url
    }))
  });
});

module.exports = router;
