const { createCanvas, loadImage } = require('@napi-rs/canvas');
const axios = require('axios');

const backgroundList = [
  'https://files.catbox.moe/jbd23e.jpg',
  'https://files.catbox.moe/7fja3z.jpg',
  'https://files.catbox.moe/8j0asj.jpg',
  'https://files.catbox.moe/jtsp76.jpg',
  'https://files.catbox.moe/0eslpr.jpg',
  'https://files.catbox.moe/ileqbd.jpg',
  'https://files.catbox.moe/utir3q.jpg',
  'https://files.catbox.moe/jl2sar.jpg',
  'https://files.catbox.moe/j235gb.jpg',
  'https://files.catbox.moe/dlxjj6.jpg',
  'https://files.catbox.moe/awoh5v.jpg',
  'https://files.catbox.moe/2wgtbb.jpg',
  'https://files.catbox.moe/hbbufy.jpg',
  'https://files.catbox.moe/0y5a57.jpg',
  'https://files.catbox.moe/jk4jtv.jpg',
  'https://files.catbox.moe/ucw40m.jpg'
];

module.exports = function(app) {
    // Endpoint untuk fakeff lobby
    app.get('/creator/fakeff', async (req, res) => {
        try {
            const { nickname, nomor } = req.query;
            
            if (!nickname) {
                return res.status(400).json({
                    status: false,
                    error: 'Parameter nickname diperlukan'
                });
            }

            const max = backgroundList.length;
            const index = nomor ? 
                (isNaN(nomor) || nomor < 1 || nomor > max ? 
                    Math.floor(Math.random() * max) : 
                    parseInt(nomor) - 1) : 
                Math.floor(Math.random() * max);

            // Load font
            const fontUrl = 'https://files.cloudkuimages.guru/fonts/vF3tpPDf.ttf';
            const fontResponse = await axios.get(fontUrl, { responseType: 'arraybuffer' });
            const fontBuffer = Buffer.from(fontResponse.data);

            // Load background image
            const bg = await loadImage(backgroundList[index]);
            const canvas = createCanvas(bg.width, bg.height);
            const ctx = canvas.getContext('2d');

            // Draw background
            ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

            // Register font
            ctx.font = 'bold 33px "Custom Font"';
            ctx.addFont(fontBuffer, 'Custom Font');

            // Set text style
            ctx.fillStyle = '#ffb300';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Draw nickname
            ctx.fillText(nickname, 355, canvas.height - 250);

            // Convert to buffer
            const imageBuffer = canvas.toBuffer('image/jpeg');

            res.set('Content-Type', 'image/jpeg');
            res.send(imageBuffer);

        } catch (error) {
            console.error('FakeFF Error:', error);
            res.status(500).json({
                status: false,
                error: error.message
            });
        }
    });

    // Endpoint untuk mendapatkan list background
    app.get('/creator/fakeff/backgrounds', async (req, res) => {
        try {
            res.status(200).json({
                status: true,
                total: backgroundList.length,
                backgrounds: backgroundList.map((url, index) => ({
                    id: index + 1,
                    url: url
                }))
            });
        } catch (error) {
            res.status(500).json({
                status: false,
                error: error.message
            });
        }
    });
};
