const axios = require("axios");
const fileType = require('file-type');

module.exports = function(app) {
    const BASE_URL = "https://api-faa-skuarta2.vercel.app/faa";

    // Daftar metode yang tersedia
    const methods = {
        'toturky': 'Turkey Filter',
        'toghibli': 'Ghibli Filter', 
        'tomekah': 'Mekah Filter',
        'toanime': 'Anime Filter',
        'tobotak': 'Botak Filter',
        'tobrewok': 'Brewok Filter',
        'tochibi': 'Chibi Filter',
        'todubai': 'Dubai Filter',
        'tofigura': 'Figura Filter',
        'tofigurav2': 'Figura V2 Filter',
        'tofigurav3': 'Figura V3 Filter',
        'tohijab': 'Hijab Filter',
        'tohitam': 'Hitam Filter',
        'tojepang': 'Jepang Filter',
        'tokacamata': 'Kacamata Filter',
        'tokamboja': 'Kamboja Filter',
        'tolego': 'Lego Filter',
        'tomaya': 'Maya Filter',
        'tomoai': 'Moai Filter',
        'tomonyet': 'Monyet Filter',
        'topacar': 'Pacar Filter',
        'topacarv2': 'Pacar V2 Filter',
        'topiramida': 'Piramida Filter',
        'topolaroid': 'Polaroid Filter',
        'toputih': 'Putih Filter',
        'toreal': 'Real Filter',
        'toroblox': 'Roblox Filter',
        'tosdmtinggi': 'SDM Tinggi Filter',
        'tosingapura': 'Singapura Filter',
        'totua': 'Tua Filter',
        'tozombie': 'Zombie Filter'
    };

    // Fungsi upload ke CDN
    async function uploadToCDN(imageBuffer, filename) {
        try {
            const FormData = require('form-data');
            const formData = new FormData();
            formData.append('reqtype', 'fileupload');
            formData.append('fileToUpload', imageBuffer, { filename });

            const response = await axios.post('https://catbox.moe/user/api.php', formData, {
                headers: formData.getHeaders(),
                timeout: 30000
            });

            if (response.data && response.data.startsWith('http')) {
                return response.data.trim();
            }
            throw new Error('Upload to CDN failed');
        } catch (error) {
            console.error('CDN Upload Error:', error.message);
            throw error;
        }
    }

    // Endpoint: Dinz AI Filter
    app.get('/ai/dinz/url', async (req, res) => {
        try {
            const { url, metode } = req.query;

            if (!url) {
                return res.status(400).json({
                    status: false,
                    error: 'Parameter url diperlukan',
                    example: '/ai/dinz/url?url=https://example.com/image.jpg&metode=toghibli'
                });
            }

            if (!metode) {
                return res.status(400).json({
                    status: false,
                    error: 'Parameter metode diperlukan',
                    example: '/ai/dinz/url?url=https://example.com/image.jpg&metode=toghibli',
                    available_methods: Object.keys(methods)
                });
            }

            if (!methods[metode]) {
                return res.status(400).json({
                    status: false,
                    error: 'Metode tidak valid',
                    available_methods: Object.keys(methods)
                });
            }

            console.log(`🎨 Applying ${metode} to: ${url}`);

            // Call Faa API
            const apiUrl = `${BASE_URL}/${metode}?url=${encodeURIComponent(url)}`;
            const response = await axios.get(apiUrl, {
                responseType: 'arraybuffer',
                timeout: 60000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            const resultBuffer = Buffer.from(response.data);
            const resultFileType = await fileType.fromBuffer(resultBuffer);

            // Upload ke CDN
            const filename = `${metode}_${Date.now()}.${resultFileType.ext}`;
            const cdnUrl = await uploadToCDN(resultBuffer, filename);

            res.json({
                status: true,
                metode: metode,
                metode_name: methods[metode],
                original_url: url,
                cdn_url: cdnUrl,
                filename: filename,
                size: resultBuffer.length,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Dinz API Error:', error.message);
            res.status(500).json({
                status: false,
                error: error.message
            });
        }
    });

    // Endpoint: List methods
    app.get('/ai/dinz/methods', (req, res) => {
        res.json({
            status: true,
            total_methods: Object.keys(methods).length,
            methods: methods
        });
    });
};
