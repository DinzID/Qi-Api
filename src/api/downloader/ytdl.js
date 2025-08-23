const axios = require('axios');

module.exports = function(app) {
    // Konfigurasi API
    const vredenAPI = {
        baseUrl: 'https://api.vreden.my.id/api',
        endpoints: {
            ytplaymp3: '/ytplaymp3?query=',
            ytmp3: '/ytmp3?url='
        },
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
            'Connection': 'keep-alive'
        }
    };

    // Helper function
    function handleResponse(success, code, result) {
        return {
            success,
            code,
            result,
            timestamp: new Date().toISOString(),
            api_source: 'api.vreden.my.id'
        };
    }

    // Endpoint: Search and Download MP3 by Query
    app.get('/downloader/ytmp3/search', async (req, res) => {
        try {
            const { query } = req.query;

            if (!query) {
                return res.status(400).json(handleResponse(false, 400, {
                    error: 'Parameter query diperlukan',
                    example: '/downloader/ytmp3/search?query=lagu%20barat'
                }));
            }

            console.log(`🔍 Searching MP3 for: ${query}`);

            const apiUrl = `${vredenAPI.baseUrl}${vredenAPI.endpoints.ytplaymp3}${encodeURIComponent(query)}`;
            
            const response = await axios.get(apiUrl, {
                headers: vredenAPI.headers,
                timeout: 30000
            });

            const data = response.data;

            // Format response yang konsisten
            const result = {
                query: query,
                video: {
                    id: data.id || null,
                    title: data.title || null,
                    duration: data.duration || null,
                    thumbnail: data.thumb || null,
                    channel: data.channel || null,
                    views: data.views || null
                },
                audio: {
                    url: data.url || null,
                    quality: data.quality || null,
                    size: data.size || null,
                    format: data.format || 'mp3'
                },
                download: data.dl_url || null,
                metadata: {
                    uploaded: data.uploaded || null,
                    uploaded_date: data.uploaded_date || null
                }
            };

            res.json(handleResponse(true, 200, result));

        } catch (error) {
            console.error('YTMP3 Search Error:', error.message);

            if (error.response) {
                res.status(error.response.status).json(handleResponse(false, error.response.status, {
                    error: 'API external error',
                    status: error.response.status,
                    message: error.response.statusText
                }));
            } else if (error.request) {
                res.status(408).json(handleResponse(false, 408, {
                    error: 'Request timeout',
                    message: 'Tidak dapat terhubung ke server external'
                }));
            } else {
                res.status(500).json(handleResponse(false, 500, {
                    error: 'Internal server error',
                    message: error.message
                }));
            }
        }
    });

    // Endpoint: Download MP3 by URL
    app.get('/downloader/ytmp3/download', async (req, res) => {
        try {
            const { url } = req.query;

            if (!url) {
                return res.status(400).json(handleResponse(false, 400, {
                    error: 'Parameter url diperlukan',
                    example: '/downloader/ytmp3/download?url=https://youtu.be/VIDEO_ID'
                }));
            }

            // Validasi URL YouTube
            if (!url.includes('youtube.com/') && !url.includes('youtu.be/')) {
                return res.status(400).json(handleResponse(false, 400, {
                    error: 'URL harus berupa link YouTube',
                    example: 'https://youtube.com/watch?v=... atau https://youtu.be/...'
                }));
            }

            console.log(`⬇️ Downloading MP3 from: ${url}`);

            const apiUrl = `${vredenAPI.baseUrl}${vredenAPI.endpoints.ytmp3}${encodeURIComponent(url)}`;
            
            const response = await axios.get(apiUrl, {
                headers: vredenAPI.headers,
                timeout: 45000 // 45 detik untuk download
            });

            const data = response.data;

            const result = {
                original_url: url,
                video: {
                    id: data.id || null,
                    title: data.title || null,
                    duration: data.duration || null,
                    thumbnail: data.thumb || null
                },
                audio: {
                    download_url: data.url || null,
                    direct_url: data.dl_url || null,
                    quality: data.quality || null,
                    size: data.size || null,
                    format: data.format || 'mp3'
                },
                success: data.success || false,
                message: data.message || 'Download ready'
            };

            res.json(handleResponse(true, 200, result));

        } catch (error) {
            console.error('YTMP3 Download Error:', error.message);

            if (error.response) {
                res.status(error.response.status).json(handleResponse(false, error.response.status, {
                    error: 'Download failed',
                    status: error.response.status,
                    message: error.response.data?.message || error.response.statusText
                }));
            } else if (error.request) {
                res.status(408).json(handleResponse(false, 408, {
                    error: 'Download timeout',
                    message: 'Proses download terlalu lama'
                }));
            } else {
                res.status(500).json(handleResponse(false, 500, {
                    error: 'Internal server error',
                    message: error.message
                }));
            }
        }
    });

    // Endpoint: Direct MP3 Download (Redirect to audio)
    app.get('/downloader/ytmp3/direct', async (req, res) => {
        try {
            const { url } = req.query;

            if (!url) {
                return res.status(400).json(handleResponse(false, 400, {
                    error: 'Parameter url diperlukan'
                }));
            }

            const apiUrl = `${vredenAPI.baseUrl}${vredenAPI.endpoints.ytmp3}${encodeURIComponent(url)}`;
            const response = await axios.get(apiUrl, {
                headers: vredenAPI.headers,
                timeout: 30000
            });

            const audioUrl = response.data.url || response.data.dl_url;

            if (!audioUrl) {
                return res.status(404).json(handleResponse(false, 404, {
                    error: 'Audio URL tidak ditemukan'
                }));
            }

            // Redirect langsung ke audio
            res.redirect(audioUrl);

        } catch (error) {
            console.error('Direct Download Error:', error.message);
            res.status(500).json(handleResponse(false, 500, {
                error: 'Direct download failed',
                message: error.message
            }));
        }
    });

    // Endpoint: Health Check
    app.get('/downloader/ytmp3/health', async (req, res) => {
        try {
            // Test dengan search kecil
            const testUrl = `${vredenAPI.baseUrl}${vredenAPI.endpoints.ytplaymp3}test`;
            const response = await axios.get(testUrl, {
                headers: vredenAPI.headers,
                timeout: 10000,
                validateStatus: () => true
            });

            res.json(handleResponse(true, 200, {
                status: 'healthy',
                api_accessible: response.status === 200,
                response_status: response.status,
                test_query: 'test'
            }));

        } catch (error) {
            res.json(handleResponse(false, 500, {
                status: 'unhealthy',
                error: error.message
            }));
        }
    });

    // Endpoint: Info
    app.get('/downloader/ytmp3/info', (req, res) => {
        res.json(handleResponse(true, 200, {
            service: 'YouTube to MP3 Downloader',
            version: '1.0',
            source: 'api.vreden.my.id',
            endpoints: {
                search: '/downloader/ytmp3/search?query=[keywords]',
                download: '/downloader/ytmp3/download?url=[youtube_url]',
                direct: '/downloader/ytmp3/direct?url=[youtube_url]',
                health: '/downloader/ytmp3/health',
                info: '/downloader/ytmp3/info'
            },
            features: [
                'Search YouTube videos and convert to MP3',
                'Download MP3 from YouTube URL',
                'Direct audio streaming',
                'High quality audio'
            ],
            limits: {
                timeout: '30-45 seconds',
                max_duration: 'Unknown (depends on API)'
            },
            examples: {
                search: '/downloader/ytmp3/search?query=alan%20walker%20faded',
                download: '/downloader/ytmp3/download?url=https://youtu.be/60ItHLz5WEA',
                direct: '/downloader/ytmp3/direct?url=https://youtu.be/60ItHLz5WEA'
            }
        }));
    });

    // Endpoint: Bulk search (multiple queries)
    app.get('/downloader/ytmp3/bulk', async (req, res) => {
        try {
            const { queries } = req.query;

            if (!queries) {
                return res.status(400).json(handleResponse(false, 400, {
                    error: 'Parameter queries diperlukan',
                    example: '/downloader/ytmp3/bulk?queries=alan walker,ed sheeran,maroon 5'
                }));
            }

            const queryList = queries.split(',').map(q => q.trim()).filter(q => q);
            const results = [];

            for (const query of queryList.slice(0, 5)) { // Max 5 queries
                try {
                    const apiUrl = `${vredenAPI.baseUrl}${vredenAPI.endpoints.ytplaymp3}${encodeURIComponent(query)}`;
                    const response = await axios.get(apiUrl, {
                        headers: vredenAPI.headers,
                        timeout: 15000
                    });

                    results.push({
                        query,
                        success: true,
                        data: response.data
                    });
                } catch (error) {
                    results.push({
                        query,
                        success: false,
                        error: error.message
                    });
                }
            }

            res.json(handleResponse(true, 200, {
                total_queries: queryList.length,
                processed: results.length,
                results
            }));

        } catch (error) {
            res.status(500).json(handleResponse(false, 500, {
                error: 'Bulk search failed',
                message: error.message
            }));
        }
    });

    // Endpoint: Download MP4 (jika ada)
    app.get('/downloader/ytmp4/download', async (req, res) => {
        try {
            const { url } = req.query;

            if (!url) {
                return res.status(400).json(handleResponse(false, 400, {
                    error: 'Parameter url diperlukan',
                    example: '/downloader/ytmp4/download?url=https://youtu.be/VIDEO_ID'
                }));
            }

            // Untuk MP4, kita bisa coba modifikasi endpoint
            const apiUrl = `${vredenAPI.baseUrl}/ytmp4?url=${encodeURIComponent(url)}`;
            
            const response = await axios.get(apiUrl, {
                headers: vredenAPI.headers,
                timeout: 45000
            });

            const data = response.data;

            res.json(handleResponse(true, 200, {
                original_url: url,
                video: {
                    id: data.id || null,
                    title: data.title || null,
                    duration: data.duration || null,
                    thumbnail: data.thumb || null
                },
                download: {
                    url: data.url || data.dl_url || null,
                    quality: data.quality || null,
                    size: data.size || null,
                    format: 'mp4'
                }
            }));

        } catch (error) {
            console.error('YTMP4 Download Error:', error.message);
            res.status(500).json(handleResponse(false, 500, {
                error: 'MP4 download not supported or failed',
                message: error.message
            }));
        }
    });
};
