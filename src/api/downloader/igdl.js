const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('qs');

module.exports = function(app) {
    // Endpoint untuk download Instagram
    app.get('/downloader/instagram', async (req, res) => {
        try {
            const { url } = req.query;

            // Validasi input
            if (!url) {
                return res.status(400).json({
                    status: false,
                    error: 'Parameter url diperlukan',
                    example: '/downloader/instagram?url=https://www.instagram.com/p/ABC123/'
                });
            }

            if (!/instagram\.com\//.test(url)) {
                return res.status(400).json({
                    status: false,
                    error: 'Link harus berupa Instagram URL',
                    valid_types: [
                        'Postingan: https://instagram.com/p/...',
                        'Reel: https://instagram.com/reel/...', 
                        'IG TV: https://instagram.com/tv/...'
                    ]
                });
            }

            const headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            };

            const data = qs.stringify({
                url: url,
                lang: 'en'
            });

            // Request ke instasave API
            const response = await axios.post('https://api.instasave.website/media', data, {
                headers,
                timeout: 30000
            });

            // Parse HTML response
            const html = (response.data.match(/innerHTML\s*=\s*"(.+?)";/s)?.[1] || '').replace(/\\"/g, '"');
            const $ = cheerio.load(html);
            const mediaResults = [];

            // Extract media information
            $('.download-items').each((_, element) => {
                const downloadUrl = $(element).find('a[title="Download"]').attr('href');
                const type = $(element).find('.format-icon i').attr('class')?.includes('ivideo') ? 'video' : 'image';
                
                if (downloadUrl) {
                    mediaResults.push({
                        type: type,
                        url: downloadUrl,
                        filename: downloadUrl.split('/').pop() || 'instagram_media'
                    });
                }
            });

            if (mediaResults.length === 0) {
                return res.status(404).json({
                    status: false,
                    error: 'Media tidak ditemukan',
                    message: 'Post mungkin private atau tidak tersedia'
                });
            }

            // Success response
            res.status(200).json({
                status: true,
                original_url: url,
                total_media: mediaResults.length,
                media: mediaResults,
                timestamp: new Date().toISOString(),
                metadata: {
                    platform: 'Instagram',
                    api_source: 'instasave.website'
                }
            });

        } catch (error) {
            console.error('Instagram API Error:', error.message);
            
            // Handle different error types
            if (error.response) {
                res.status(error.response.status).json({
                    status: false,
                    error: 'API Error: ' + error.response.statusText,
                    details: 'Service mungkin sedang down'
                });
            } else if (error.request) {
                res.status(408).json({
                    status: false,
                    error: 'Request timeout',
                    details: 'Tidak dapat terhubung ke server'
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

    // Endpoint untuk health check
    app.get('/downloader/instagram/health', async (req, res) => {
        try {
            // Test dengan sample URL
            const testUrl = 'https://www.instagram.com/p/C3R5lC2O4hK/';
            const headers = {
                'Content-Type': 'application/x-www-form-urlencoded'
            };
            const data = qs.stringify({
                url: testUrl,
                lang: 'en'
            });

            await axios.post('https://api.instasave.website/media', data, {
                headers,
                timeout: 10000
            });

            res.status(200).json({
                status: true,
                message: 'Instagram API is working',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            res.status(500).json({
                status: false,
                error: 'Health check failed: ' + error.message,
                timestamp: new Date().toISOString()
            });
        }
    });

    // Endpoint untuk info
    app.get('/downloader/instagram/info', (req, res) => {
        res.status(200).json({
            status: true,
            service: 'Instagram Downloader API',
            version: '1.0',
            endpoints: {
                download: '/downloader/instagram?url=[instagram_url]',
                health: '/downloader/instagram/health',
                info: '/downloader/instagram/info'
            },
            supported_formats: [
                'Posts: https://instagram.com/p/...',
                'Reels: https://instagram.com/reel/...',
                'IG TV: https://instagram.com/tv/...'
            ],
            limits: {
                max_url_length: 500,
                timeout: 30000
            }
        });
    });
};
