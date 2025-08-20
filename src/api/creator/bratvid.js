const axios = require('axios');

module.exports = function(app) {
    app.get('/creator/bratvid', async (req, res) => {
        try {
            const { text } = req.query;

            // Validasi input
            if (!text) {
                return res.status(400).json({
                    status: false,
                    error: 'Parameter text diperlukan',
                    example: '/creator/bratvid?text=hai+sayang+💓🏿'
                });
            }

            // Encode text untuk URL
            const encodedText = encodeURIComponent(text);
            const apiUrl = `https://api-faa-skuarta.vercel.app/faa/bratvid?text=${encodedText}`;

            // Request ke API external untuk mendapatkan video
            const response = await axios.get(apiUrl, {
                responseType: 'arraybuffer', // Important untuk binary data
                timeout: 30000, // 30 detik timeout untuk video
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'video/*'
                }
            });

            // Cek jika response adalah video
            const contentType = response.headers['content-type'];
            const isVideo = contentType && (
                contentType.startsWith('video/') || 
                contentType === 'application/octet-stream' ||
                contentType.includes('mp4') ||
                contentType.includes('webm')
            );

            if (!isVideo) {
                return res.status(500).json({
                    status: false,
                    error: 'Response bukan video',
                    details: 'API external mengembalikan tipe content: ' + contentType,
                    expected: 'video/mp4, video/webm, etc'
                });
            }

            // Set header dan kirim video
            res.set('Content-Type', contentType || 'video/mp4');
            res.set('Content-Length', response.data.length);
            res.set('X-API-Source', 'api-faa-skuarta.vercel.app');
            res.set('X-Generated-At', new Date().toISOString());
            res.set('Content-Disposition', 'inline; filename="brat-video.mp4"');
            
            res.send(response.data);

        } catch (error) {
            console.error('BratVid API Error:', error.message);

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

    // POST endpoint untuk alternative
    app.post('/creator/bratvid', async (req, res) => {
        try {
            const { text } = req.body;

            if (!text) {
                return res.status(400).json({
                    status: false,
                    error: 'Parameter text diperlukan di body'
                });
            }

            const encodedText = encodeURIComponent(text);
            const apiUrl = `https://api-faa-skuarta.vercel.app/faa/bratvid?text=${encodedText}`;
            
            const response = await axios.get(apiUrl, {
                responseType: 'arraybuffer',
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'video/*'
                }
            });

            const contentType = response.headers['content-type'] || 'video/mp4';
            
            res.set('Content-Type', contentType);
            res.set('Content-Length', response.data.length);
            res.set('Content-Disposition', 'inline; filename="brat-video.mp4"');
            res.send(response.data);

        } catch (error) {
            res.status(500).json({
                status: false,
                error: 'Failed to generate video',
                details: error.message
            });
        }
    });

    // Endpoint untuk preview info
    app.get('/creator/bratvid/preview', (req, res) => {
        res.status(200).json({
            status: true,
            service: 'Brat Video Generator API',
            version: '1.0',
            description: 'API untuk generate video brat message dengan emoji',
            endpoints: {
                video: '/creator/bratvid?text=[message]',
                post: 'POST /creator/bratvid',
                preview: '/creator/bratvid/preview',
                info: '/creator/bratvid/info'
            },
            parameters: {
                text: 'String - Pesan yang akan digenerate menjadi video (required)'
            },
            examples: {
                direct: '/creator/bratvid?text=hai+sayang+💓🏿',
                with_emoji: '/creator/bratvid?text=love+you+💖🐱🌸',
                simple: '/creator/bratvid?text=hello+world'
            },
            features: [
                'Generate video langsung dari text',
                'Support emoji dan karakter khusus',
                'Auto URL encoding',
                'Fast response time'
            ],
            source_api: 'https://api-faa-skuarta.vercel.app/faa/bratvid',
            expected_format: 'video/mp4 (MP4)',
            limits: {
                max_text_length: 500,
                timeout: 30000,
                file_size: '~1-5MB (estimated)'
            }
        });
    });

    // Endpoint untuk health check
    app.get('/creator/bratvid/health', async (req, res) => {
        try {
            // Test connection dengan request kecil
            const testUrl = 'https://api-faa-skuarta.vercel.app/faa/bratvid?text=test';
            const response = await axios.get(testUrl, {
                timeout: 15000,
                validateStatus: () => true, // Accept any status code
                headers: {
                    'Range': 'bytes=0-100' // Hanya request sebagian kecil
                }
            });

            const contentType = response.headers['content-type'];
            const isVideo = contentType && (
                contentType.startsWith('video/') || 
                contentType === 'application/octet-stream'
            );

            res.status(200).json({
                status: true,
                message: 'BratVid API is healthy',
                external_api: 'accessible',
                response_type: contentType,
                is_video: isVideo,
                content_length: response.headers['content-length'],
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

    // Endpoint untuk info
    app.get('/creator/bratvid/info', (req, res) => {
        res.status(200).json({
            status: true,
            api_name: 'Brat Video Generator',
            methods: ['GET', 'POST'],
            response_type: 'video/mp4, video/webm, or other video formats',
            required_parameters: ['text'],
            example_usage: {
                browser: 'https://your-api.com/creator/bratvid?text=hai+sayang+💓🏿',
                html: `<video src="https://your-api.com/creator/bratvid?text=hai+sayang+💓🏿" controls></video>`,
                curl: 'curl -o video.mp4 "https://your-api.com/creator/bratvid?text=hai%20sayang%20%F0%9F%92%93%F0%9F%97%BF"'
            },
            emoji_support: {
                status: 'fully supported',
                examples: ['💓', '🏿', '🐱', '🌸', '💖', '🔥'],
                encoding: 'automatic URL encoding'
            },
            performance: {
                timeout: '30 seconds',
                recommended_text_length: '10-100 characters',
                cache: 'recommended for repeated requests'
            }
        });
    });
};
