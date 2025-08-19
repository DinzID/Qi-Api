const axios = require('axios');

module.exports = function(app) {
    // Endpoint untuk brat message (return image)
    app.get('/creator/brat', async (req, res) => {
        try {
            const { text } = req.query;

            // Validasi input
            if (!text) {
                return res.status(400).json({
                    status: false,
                    error: 'Parameter text diperlukan',
                    example: '/creator/brat?text=hai+sayang'
                });
            }

            // Encode text untuk URL
            const encodedText = encodeURIComponent(text);
            const apiUrl = `https://api-faa-skuarta.vercel.app/faa/brat?text=${encodedText}`;

            // Request ke API external untuk mendapatkan image
            const response = await axios.get(apiUrl, {
                responseType: 'arraybuffer', // Important untuk binary data
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'image/*'
                }
            });

            // Cek jika response adalah image
            const contentType = response.headers['content-type'];
            if (!contentType || !contentType.startsWith('image/')) {
                return res.status(500).json({
                    status: false,
                    error: 'Response bukan gambar',
                    details: 'API external mengembalikan tipe content yang tidak diharapkan'
                });
            }

            // Set header dan kirim image
            res.set('Content-Type', contentType);
            res.set('Content-Length', response.data.length);
            res.set('X-API-Source', 'api-faa-skuarta.vercel.app');
            res.set('X-Generated-At', new Date().toISOString());
            
            res.send(response.data);

        } catch (error) {
            console.error('Brat API Error:', error.message);

            // Handle different error types
            if (error.code === 'ECONNREFUSED') {
                res.status(503).json({
                    status: false,
                    error: 'Service unavailable',
                    details: 'API external tidak dapat diakses'
                });
            } else if (error.response) {
                res.status(error.response.status).json({
                    status: false,
                    error: 'External API error',
                    status_code: error.response.status,
                    details: error.response.statusText
                });
            } else if (error.request) {
                res.status(408).json({
                    status: false,
                    error: 'Request timeout',
                    details: 'Tidak dapat terhubung ke server external'
                });
            } else {
                res.status(500).json({
                    status: false,
                    error: 'Internal server error',
                    details: error.message
                });
            }
        }
    });

    // Endpoint untuk preview brat (return JSON dengan URL)
    app.get('/creator/brat/preview', async (req, res) => {
        try {
            const { text } = req.query;

            if (!text) {
                return res.status(400).json({
                    status: false,
                    error: 'Parameter text diperlukan',
                    example: '/creator/brat/preview?text=hai+sayang'
                });
            }

            const encodedText = encodeURIComponent(text);
            const imageUrl = `https://api-faa-skuarta.vercel.app/faa/brat?text=${encodedText}`;

            res.status(200).json({
                status: true,
                image_url: imageUrl,
                direct_url: `/creator/brat?text=${encodedText}`,
                text: text,
                timestamp: new Date().toISOString(),
                usage: 'Kunjungi URL image_url untuk mendapatkan gambar langsung'
            });

        } catch (error) {
            res.status(500).json({
                status: false,
                error: 'Internal server error',
                details: error.message
            });
        }
    });

    // Endpoint untuk info brat API
    app.get('/creator/brat/info', (req, res) => {
        res.status(200).json({
            status: true,
            service: 'Brat Message Image API',
            version: '1.0',
            description: 'API untuk generate gambar brat message dengan emoji',
            endpoints: {
                image: '/creator/brat?text=[message]',
                preview: '/creator/brat/preview?text=[message]',
                info: '/creator/brat/info',
                health: '/creator/brat/health'
            },
            parameters: {
                text: 'String - Pesan yang akan digenerate menjadi gambar (required)'
            },
            examples: {
                direct_image: '/creator/brat?text=hai+sayang+🐱🐹🐤',
                preview_info: '/creator/brat/preview?text=hello+world',
                with_emoji: '/creator/brat?text=love+you+💖🐱🌸'
            },
            source_api: 'https://api-faa-skuarta.vercel.app/faa/brat',
            features: [
                'Direct image response',
                'Support emoji dalam text',
                'Auto URL encoding',
                'Error handling'
            ],
            limits: {
                max_text_length: 500,
                timeout: 15000
            }
        });
    });

    // Endpoint untuk health check
    app.get('/creator/brat/health', async (req, res) => {
        try {
            // Test connection dengan request kecil
            const testUrl = 'https://api-faa-skuarta.vercel.app/faa/brat?text=test';
            const response = await axios.get(testUrl, {
                timeout: 10000,
                validateStatus: () => true // Accept any status code
            });

            const isImage = response.headers['content-type']?.startsWith('image/');

            res.status(200).json({
                status: true,
                message: 'Brat API is healthy',
                external_api: 'accessible',
                response_type: response.headers['content-type'],
                is_image: isImage,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            res.status(500).json({
                status: false,
                error: 'Health check failed',
                details: error.message,
                external_api: 'inaccessible',
                timestamp: new Date().toISOString()
            });
        }
    });
}; 
