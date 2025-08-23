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

    // Endpoint: Search and Download MP3 by Query
    app.get('/downloader/ytmp3/search', async (req, res) => {
        try {
            const { query } = req.query;

            if (!query) {
                return res.status(400).json({
                    status: 400,
                    creator: "DinzID",
                    error: "Parameter query diperlukan",
                    example: "/downloader/ytmp3/search?query=lagu%20barat"
                });
            }

            console.log(`🔍 Searching MP3 for: ${query}`);

            const apiUrl = `${vredenAPI.baseUrl}${vredenAPI.endpoints.ytplaymp3}${encodeURIComponent(query)}`;
            
            const response = await axios.get(apiUrl, {
                headers: vredenAPI.headers,
                timeout: 30000
            });

            // Return seluruh response dari API vreden + tambahkan creator DinzID
            const result = {
                status: response.data.status || 200,
                creator: "DinzID",
                result: response.data.result || response.data
            };
            
            res.json(result);

        } catch (error) {
            console.error('YTMP3 Search Error:', error.message);

            res.status(500).json({
                status: 500,
                creator: "DinzID",
                error: "Internal server error",
                message: error.message
            });
        }
    });

    // Endpoint: Download MP3 by URL
    app.get('/downloader/ytmp3/download', async (req, res) => {
        try {
            const { url } = req.query;

            if (!url) {
                return res.status(400).json({
                    status: 400,
                    creator: "DinzID",
                    error: "Parameter url diperlukan",
                    example: "/downloader/ytmp3/download?url=https://youtu.be/VIDEO_ID"
                });
            }

            console.log(`⬇️ Downloading MP3 from: ${url}`);

            const apiUrl = `${vredenAPI.baseUrl}${vredenAPI.endpoints.ytmp3}${encodeURIComponent(url)}`;
            
            const response = await axios.get(apiUrl, {
                headers: vredenAPI.headers,
                timeout: 45000
            });

            // Return seluruh response dari API vreden + tambahkan creator DinzID
            const result = {
                status: response.data.status || 200,
                creator: "DinzID",
                result: response.data.result || response.data
            };
            
            res.json(result);

        } catch (error) {
            console.error('YTMP3 Download Error:', error.message);

            res.status(500).json({
                status: 500,
                creator: "DinzID",
                error: "Download failed",
                message: error.message
            });
        }
    });

    // Endpoint: Direct MP3 Download (Redirect to audio)
    app.get('/downloader/ytmp3/direct', async (req, res) => {
        try {
            const { url } = req.query;

            if (!url) {
                return res.status(400).json({
                    status: 400,
                    creator: "DinzID",
                    error: "Parameter url diperlukan"
                });
            }

            const apiUrl = `${vredenAPI.baseUrl}${vredenAPI.endpoints.ytmp3}${encodeURIComponent(url)}`;
            const response = await axios.get(apiUrl, {
                headers: vredenAPI.headers,
                timeout: 30000
            });

            // Cari audio URL dari berbagai kemungkinan field
            const audioData = response.data.result || response.data;
            const audioUrl = audioData.download?.url || audioData.url || audioData.dl_url;

            if (!audioUrl) {
                return res.status(404).json({
                    status: 404,
                    creator: "DinzID",
                    error: "Audio URL tidak ditemukan"
                });
            }

            // Redirect langsung ke audio
            res.redirect(audioUrl);

        } catch (error) {
            console.error('Direct Download Error:', error.message);
            res.status(500).json({
                status: 500,
                creator: "DinzID",
                error: "Direct download failed",
                message: error.message
            });
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

            res.json({
                status: 200,
                creator: "DinzID",
                result: {
                    status: response.status === 200,
                    api_accessible: response.status === 200,
                    response_status: response.status,
                    test_query: "test"
                }
            });

        } catch (error) {
            res.json({
                status: 500,
                creator: "DinzID",
                error: "Health check failed",
                message: error.message
            });
        }
    });

    // Endpoint: Info
    app.get('/downloader/ytmp3/info', (req, res) => {
        res.json({
            status: 200,
            creator: "DinzID",
            result: {
                service: "YouTube to MP3 Downloader",
                version: "1.0",
                source: "api.vreden.my.id",
                endpoints: {
                    search: "/downloader/ytmp3/search?query=[keywords]",
                    download: "/downloader/ytmp3/download?url=[youtube_url]",
                    direct: "/downloader/ytmp3/direct?url=[youtube_url]",
                    health: "/downloader/ytmp3/health",
                    info: "/downloader/ytmp3/info"
                },
                examples: {
                    search: "/downloader/ytmp3/search?query=alan%20walker%20faded",
                    download: "/downloader/ytmp3/download?url=https://youtu.be/60ItHLz5WEA",
                    direct: "/downloader/ytmp3/direct?url=https://youtu.be/60ItHLz5WEA"
                }
            }
        });
    });

    // Endpoint untuk debug response structure
    app.get('/downloader/ytmp3/debug', async (req, res) => {
        try {
            const { query, url } = req.query;
            let apiUrl;

            if (query) {
                apiUrl = `${vredenAPI.baseUrl}${vredenAPI.endpoints.ytplaymp3}${encodeURIComponent(query)}`;
            } else if (url) {
                apiUrl = `${vredenAPI.baseUrl}${vredenAPI.endpoints.ytmp3}${encodeURIComponent(url)}`;
            } else {
                return res.status(400).json({
                    status: 400,
                    creator: "DinzID",
                    error: "Parameter query atau url diperlukan"
                });
            }

            const response = await axios.get(apiUrl, {
                headers: vredenAPI.headers,
                timeout: 15000
            });

            res.json({
                status: 200,
                creator: "DinzID",
                raw_response: response.data,
                structure: Object.keys(response.data),
                has_result: !!response.data.result,
                result_structure: response.data.result ? Object.keys(response.data.result) : null,
                message: "Debug response structure"
            });

        } catch (error) {
            res.json({
                status: 500,
                creator: "DinzID",
                error: error.message,
                response: error.response?.data
            });
        }
    });
};
