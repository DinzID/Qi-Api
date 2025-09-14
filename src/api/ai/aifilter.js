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

    // Endpoint utama - SIMPLE
    app.get('/ai/filter', async (req, res) => {
        try {
            const { url, method } = req.query;

            if (!url) {
                return res.status(400).json({
                    status: false,
                    error: 'Parameter url diperlukan',
                    example: '/ai/filter?url=https://example.com/image.jpg&method=toghibli'
                });
            }

            if (!method) {
                return res.status(400).json({
                    status: false,
                    error: 'Parameter method diperlukan',
                    example: '/ai/filter?url=https://example.com/image.jpg&method=toghibli',
                    methods: Object.keys(methods)
                });
            }

            if (!methods[method]) {
                return res.status(400).json({
                    status: false,
                    error: 'Method tidak valid',
                    available_methods: Object.keys(methods)
                });
            }

            console.log(`🎨 Applying ${method} to: ${url}`);

            // Langsung call Faa API
            const apiUrl = `${BASE_URL}/${method}?url=${encodeURIComponent(url)}`;
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
            const filename = `${method}_${Date.now()}.${resultFileType.ext}`;
            const cdnUrl = await uploadToCDN(resultBuffer, filename);

            res.json({
                status: true,
                method: method,
                method_name: methods[method],
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
    app.get('/ai/filter/methods', (req, res) => {
        res.json({
            status: true,
            total_methods: Object.keys(methods).length,
            methods: methods
        });
    });

    // Endpoint: Health check
    app.get('/ai/filter/health', async (req, res) => {
        try {
            // Test dengan method pertama
            const testMethod = Object.keys(methods)[0];
            const testUrl = 'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg';
            const apiUrl = `${BASE_URL}/${testMethod}?url=${encodeURIComponent(testUrl)}`;

            await axios.get(apiUrl, { timeout: 10000 });
            
            res.json({
                status: true,
                message: 'Dinz API is working',
                method_tested: testMethod,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.json({
                status: false,
                error: 'Health check failed',
                message: error.message
            });
        }
    });
};
