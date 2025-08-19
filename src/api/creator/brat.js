const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function(app) {
    // Endpoint untuk brat message
    app.get('/creator/brat', async (req, res) => {
        try {
            const { text } = req.query;

            // Validasi input
            if (!text) {
                return res.status(400).json({
                    status: false,
                    error: 'Parameter text diperlukan',
                    example: '/creator/brat?text=hai+sayang+🐱🐹🐤'
                });
            }

            // Encode text untuk URL
            const encodedText = encodeURIComponent(text);
            const apiUrl = `https://api-faa-skuarta.vercel.app/faa/brat?text=${encodedText}`;

            // Request ke API external
            const response = await axios.get(apiUrl, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json'
                }
            });

            // Parse response
            const responseData = response.data;

            // Jika response adalah JSON (berdasarkan contoh)
            if (typeof responseData === 'object' && responseData !== null) {
                res.status(200).json({
                    status: true,
                    result: responseData,
                    api_source: 'api-faa-skuarta.vercel.app',
                    timestamp: new Date().toISOString()
                });
            } 
            // Jika response adalah HTML (kemungkinan scraped content)
            else if (typeof responseData === 'string') {
                const $ = cheerio.load(responseData);
                
                // Coba extract informasi dari HTML
                const result = {
                    text: text,
                    processed_content: responseData.substring(0, 200) + '...' // Potongan konten
                };

                res.status(200).json({
                    status: true,
                    result: result,
                    api_source: 'api-faa-skuarta.vercel.app',
                    note: 'Response is HTML content',
                    timestamp: new Date().toISOString()
                });
            } 
            // Format tidak dikenali
            else {
                res.status(200).json({
                    status: true,
                    result: responseData,
                    api_source: 'api-faa-skuarta.vercel.app',
                    note: 'Unknown response format',
                    timestamp: new Date().toISOString()
                });
            }

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

    // Endpoint untuk test brat API
    app.get('/creator/brat/test', async (req, res) => {
        try {
            const testText = 'hai sayang 🐱🐹🐤';
            const encodedText = encodeURIComponent(testText);
            const apiUrl = `https://api-faa-skuarta.vercel.app/faa/brat?text=${encodedText}`;

            const response = await axios.get(apiUrl, {
                timeout: 10000
            });

            res.status(200).json({
                status: true,
                test_text: testText,
                response: response.data,
                response_type: typeof response.data,
                api_url: apiUrl,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            res.status(500).json({
                status: false,
                error: 'Test failed: ' + error.message,
                timestamp: new Date().toISOString()
            });
        }
    });

    // Endpoint untuk info brat API
    app.get('/creator/brat/info', (req, res) => {
        res.status(200).json({
            status: true,
            service: 'Brat Message API',
            version: '1.0',
            description: 'API untuk memproses pesan brat dengan emoji',
            endpoints: {
                main: '/creator/brat?text=[your_message]',
                test: '/creator/brat/test',
                info: '/creator/brat/info'
            },
            parameters: {
                text: 'String - Pesan yang akan diproses (required)'
            },
            example: {
                request: '/creator/brat?text=hai+sayang+🐱🐹🐤',
                response: 'Lihat response dari api-faa-skuarta.vercel.app'
            },
            source_api: 'https://api-faa-skuarta.vercel.app/faa/brat',
            limits: {
                max_text_length: 1000,
                timeout: 15000
            }
        });
    });

    // Endpoint untuk health check
    app.get('/creator/brat/health', async (req, res) => {
        try {
            // Test connection to external API
            const testUrl = 'https://api-faa-skuarta.vercel.app/faa/brat?text=test';
            await axios.get(testUrl, { timeout: 10000 });

            res.status(200).json({
                status: true,
                message: 'Brat API is healthy',
                external_api: 'accessible',
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
