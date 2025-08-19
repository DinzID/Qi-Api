const axios = require('axios');
const FormData = require('form-data');

module.exports = function(app) {
    app.get('/ai/editfoto', async (req, res) => {
        try {
            const { url, prompt } = req.query;

            // Validasi input
            if (!url || !prompt) {
                return res.status(400).json({
                    status: false,
                    error: 'Parameter url dan prompt diperlukan',
                    example: '/ai/editfoto?url=https://example.com/photo.jpg&prompt=make%20it%20sunset'
                });
            }

            // Validasi URL
            try {
                new URL(url);
            } catch (e) {
                return res.status(400).json({
                    status: false,
                    error: 'URL tidak valid',
                    details: 'Pastikan URL lengkap dengan http/https'
                });
            }

            const apiUrl = `https://api-faa-skuarta.vercel.app/faa/editfoto?url=${encodeURIComponent(url)}&prompt=${encodeURIComponent(prompt)}`;

            // Request ke API external
            const response = await axios.get(apiUrl, {
                responseType: 'arraybuffer',
                timeout: 30000, // 30 detik timeout
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
                    details: 'API external mengembalikan tipe content yang tidak diharapkan: ' + contentType
                });
            }

            // Set header dan kirim image
            res.set('Content-Type', contentType);
            res.set('Content-Length', response.data.length);
            res.set('X-API-Source', 'api-faa-skuarta.vercel.app');
            res.set('X-Generated-At', new Date().toISOString());
            res.set('Cache-Control', 'public, max-age=3600'); // Cache 1 jam
            
            res.send(response.data);

        } catch (error) {
            console.error('EditFoto API Error:', error.message);

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
    app.post('/ai/editfoto', async (req, res) => {
        try {
            const { url, prompt } = req.body;

            if (!url || !prompt) {
                return res.status(400).json({
                    status: false,
                    error: 'Parameter url dan prompt diperlukan di body'
                });
            }

            const apiUrl = `https://api-faa-skuarta.vercel.app/faa/editfoto?url=${encodeURIComponent(url)}&prompt=${encodeURIComponent(prompt)}`;
            
            const response = await axios.get(apiUrl, {
                responseType: 'arraybuffer',
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'image/*'
                }
            });

            const contentType = response.headers['content-type'];
            if (!contentType || !contentType.startsWith('image/')) {
                return res.status(500).json({
                    status: false,
                    error: 'Response bukan gambar'
                });
            }

            res.set('Content-Type', contentType);
            res.set('Content-Length', response.data.length);
            res.send(response.data);

        } catch (error) {
            res.status(500).json({
                status: false,
                error: 'Failed to process image',
                details: error.message
            });
        }
    });

    // Endpoint untuk preview
    app.get('/ai/editfoto/preview', (req, res) => {
        res.status(200).json({
            status: true,
            service: 'AI Photo Editor API',
            version: '1.0',
            description: 'API untuk edit foto dengan AI berdasarkan prompt',
            endpoints: {
                main: '/ai/editfoto?url=[image_url]&prompt=[ai_prompt]',
                post: 'POST /ai/editfoto',
                preview: '/ai/editfoto/preview',
                info: '/ai/editfoto/info'
            },
            parameters: {
                url: 'String - URL gambar yang akan diedit (required)',
                prompt: 'String - Instruksi AI untuk edit foto (required)'
            },
            examples: {
                basic: '/ai/editfoto?url=https://example.com/photo.jpg&prompt=make%20it%20sunset',
                style: '/ai/editfoto?url=https://example.com/photo.jpg&prompt=cartoon%20style',
                effect: '/ai/editfoto?url=https://example.com/photo.jpg&prompt=add%20snow%20effect',
                enhancement: '/ai/editfoto?url=https://example.com/photo.jpg&prompt=enhance%20quality'
            },
            supported_prompts: [
                'Style changes: cartoon, anime, painting, sketch',
                'Color adjustments: sunset, night, winter, summer', 
                'Effects: blur, sharpen, contrast, brightness',
                'Enhancements: quality, resolution, face enhance',
                'Transformations: background change, object removal'
            ],
            source_api: 'https://api-faa-skuarta.vercel.app/faa/editfoto',
            limits: {
                max_url_length: 1000,
                max_prompt_length: 500,
                timeout: 30000
            }
        });
    });

    // Endpoint untuk health check
    app.get('/ai/editfoto/health', async (req, res) => {
        try {
            // Test dengan sample request
            const testUrl = 'https://api-faa-skuarta.vercel.app/faa/editfoto?url=https://example.com&prompt=test';
            const response = await axios.get(testUrl, {
                timeout: 10000,
                validateStatus: () => true
            });

            const isImage = response.headers['content-type']?.startsWith('image/');

            res.status(200).json({
                status: true,
                message: 'EditFoto API is healthy',
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

    // Endpoint untuk info
    app.get('/ai/editfoto/info', (req, res) => {
        res.status(200).json({
            status: true,
            api_name: 'AI Photo Editor',
            methods: ['GET', 'POST'],
            response_type: 'image/jpeg, image/png, image/webp',
            required_parameters: ['url', 'prompt'],
            example_usage: {
                browser: 'https://your-api.com/ai/editfoto?url=https://example.com/photo.jpg&prompt=make%20it%20sunset',
                html: '<img src="https://your-api.com/ai/editfoto?url=IMAGE_URL&prompt=cartoon%20style">',
                javascript: `fetch('/ai/editfoto?url=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent('enhance quality')}')`
            },
            tips: [
                'Gunakan URL gambar yang accessible publicly',
                'Prompt harus deskriptif dan jelas',
                'Hasil tergantung kemampuan AI external',
                'Timeout mungkin terjadi untuk proses berat'
            ]
        });
    });
};
