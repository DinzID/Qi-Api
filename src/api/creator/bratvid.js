const axios = require('axios');

module.exports = function(app) {
    // Endpoint untuk brat video - version simple dan reliable
    app.get('/creator/bratvid', async (req, res) => {
        try {
            const { text } = req.query;

            if (!text) {
                return res.status(400).json({
                    status: false,
                    error: 'Parameter text diperlukan',
                    example: '/creator/bratvid?text=hai+sayang'
                });
            }

            console.log('🔹 Request received for text:', text);

            const encodedText = encodeURIComponent(text);
            const apiUrl = `https://api-faa-skuarta.vercel.app/faa/bratvid?text=${encodedText}`;
            
            console.log('🔹 Calling external API:', apiUrl);

            // Gunakan approach yang lebih simple
            const response = await axios({
                method: 'GET',
                url: apiUrl,
                responseType: 'arraybuffer', // Kembali ke arraybuffer
                timeout: 40000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'video/mp4, video/*, */*'
                },
                maxContentLength: 50 * 1024 * 1024, // 50MB max
            });

            console.log('✅ External API response received');
            console.log('🔹 Status:', response.status);
            console.log('🔹 Content-Type:', response.headers['content-type']);
            console.log('🔹 Content-Length:', response.headers['content-length']);

            const contentType = response.headers['content-type'] || 'video/mp4';
            const contentLength = response.headers['content-length'] || response.data.length;

            // Set headers dengan benar
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Length', contentLength);
            res.setHeader('X-API-Source', 'api-faa-skuarta.vercel.app');
            res.setHeader('Cache-Control', 'public, max-age=3600');
            res.setHeader('Access-Control-Allow-Origin', '*');
            
            console.log('✅ Sending response to client...');

            // Kirim data langsung
            res.send(response.data);

            console.log('✅ Response sent successfully');

        } catch (error) {
            console.error('❌ Error details:', {
                message: error.message,
                code: error.code,
                stack: error.stack
            });

            if (error.response) {
                console.error('❌ External API response error:', {
                    status: error.response.status,
                    headers: error.response.headers,
                    data: error.response.data?.toString().substring(0, 200)
                });
            }

            res.status(500).json({
                status: false,
                error: 'Internal server error',
                message: error.message,
                code: error.code,
                suggestion: 'Coba lagi dalam beberapa saat'
            });
        }
    });

    // Test endpoint yang sangat simple
    app.get('/creator/bratvid/test', async (req, res) => {
        try {
            console.log('🧪 Running test...');
            
            const testUrl = 'https://api-faa-skuarta.vercel.app/faa/bratvid?text=test+hello';
            
            const response = await axios.get(testUrl, {
                timeout: 15000,
                responseType: 'arraybuffer'
            });

            const result = {
                status: 'success',
                external_status: response.status,
                content_type: response.headers['content-type'],
                content_length: response.data.length,
                is_video: response.headers['content-type']?.includes('video') || false,
                timestamp: new Date().toISOString()
            };

            console.log('🧪 Test result:', result);
            res.json(result);

        } catch (error) {
            console.error('🧪 Test failed:', error.message);
            res.json({
                status: 'failed',
                error: error.message,
                code: error.code
            });
        }
    });

    // Health check endpoint
    app.get('/creator/bratvid/health', (req, res) => {
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'Brat Video API',
            version: '1.0'
        });
    });

    // Demo endpoint dengan contoh text
    app.get('/creator/bratvid/demo', async (req, res) => {
        try {
            const demoText = 'hai sayang 💓🐱🌸';
            const encodedText = encodeURIComponent(demoText);
            const apiUrl = `https://api-faa-skuarta.vercel.app/faa/bratvid?text=${encodedText}`;
            
            const response = await axios({
                method: 'GET',
                url: apiUrl,
                responseType: 'arraybuffer',
                timeout: 30000
            });

            res.setHeader('Content-Type', response.headers['content-type'] || 'video/mp4');
            res.send(response.data);

        } catch (error) {
            res.json({
                status: 'demo_failed',
                error: error.message,
                example_url: 'https://api-faa-skuarta.vercel.app/faa/bratvid?text=hai+sayang+%F0%9F%92%93%F0%9F%90%B1%F0%9F%8C%BB'
            });
        }
    });
};
