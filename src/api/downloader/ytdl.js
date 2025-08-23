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

    // Helper function untuk format response yang benar
    function handleVredenResponse(data, query = null, url = null) {
        return {
            status: 200,
            creator: "DinzID",
            result: {
                status: data.status !== false,
                creator: "DinzID",
                metadata: {
                    type: "video",
                    videoId: data.metadata?.videoId || data.id || null,
                    url: data.metadata?.url || `https://youtube.com/watch?v=${data.id}`,
                    title: data.metadata?.title || data.title || null,
                    description: data.metadata?.description || null,
                    image: data.metadata?.image || data.thumb || null,
                    thumbnail: data.metadata?.thumbnail || data.thumb || null,
                    seconds: data.metadata?.seconds || data.duration?.seconds || null,
                    timestamp: data.metadata?.timestamp || data.duration || null,
                    duration: {
                        seconds: data.metadata?.duration?.seconds || data.duration?.seconds || null,
                        timestamp: data.metadata?.duration?.timestamp || data.duration || null
                    },
                    ago: data.metadata?.ago || data.uploaded || null,
                    views: data.metadata?.views || data.views || null,
                    author: {
                        name: data.metadata?.author?.name || data.channel || null,
                        url: data.metadata?.author?.url || null
                    }
                },
                download: {
                    status: data.download?.status !== false,
                    quality: data.download?.quality || data.quality || "128kbps",
                    availableQuality: data.download?.availableQuality || [92, 128, 256, 320],
                    url: data.download?.url || data.url || data.dl_url || null,
                    filename: data.download?.filename || `${data.title} (${data.quality || '128kbps'}).mp3`
                }
            }
        };
    }

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

            const result = handleVredenResponse(response.data, query);
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
                    creator: "api.vreden.my.id",
                    error: "Parameter url diperlukan",
                    example: "/downloader/ytmp3/download?url=https://youtu.be/VIDEO_ID"
                });
            }

            // Validasi URL YouTube
            if (!url.includes('youtube.com/') && !url.includes('youtu.be/')) {
                return res.status(400).json({
                    status: 400,
                    creator: "api.vreden.my.id",
                    error: "URL harus berupa link YouTube",
                    example: "https://youtube.com/watch?v=... atau https://youtu.be/..."
                });
            }

            console.log(`⬇️ Downloading MP3 from: ${url}`);

            const apiUrl = `${vredenAPI.baseUrl}${vredenAPI.endpoints.ytmp3}${encodeURIComponent(url)}`;
            
            const response = await axios.get(apiUrl, {
                headers: vredenAPI.headers,
                timeout: 45000
            });

            const result = handleVredenResponse(response.data, null, url);
            res.json(result);

        } catch (error) {
            console.error('YTMP3 Download Error:', error.message);

            res.status(500).json({
                status: 500,
                creator: "api.vreden.my.id",
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
                    creator: "api.vreden.my.id",
                    error: "Parameter url diperlukan"
                });
            }

            const apiUrl = `${vredenAPI.baseUrl}${vredenAPI.endpoints.ytmp3}${encodeURIComponent(url)}`;
            const response = await axios.get(apiUrl, {
                headers: vredenAPI.headers,
                timeout: 30000
            });

            const audioUrl = response.data.url || response.data.dl_url || response.data.download?.url;

            if (!audioUrl) {
                return res.status(404).json({
                    status: 404,
                    creator: "api.vreden.my.id",
                    error: "Audio URL tidak ditemukan"
                });
            }

            // Redirect langsung ke audio
            res.redirect(audioUrl);

        } catch (error) {
            console.error('Direct Download Error:', error.message);
            res.status(500).json({
                status: 500,
                creator: "api.vreden.my.id",
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
                creator: "api.vreden.my.id",
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
                creator: "api.vreden.my.id",
                error: "Health check failed",
                message: error.message
            });
        }
    });

    // Endpoint: Info
    app.get('/downloader/ytmp3/info', (req, res) => {
        res.json({
            status: 200,
            creator: "api.vreden.my.id",
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

    // Endpoint: Get available qualities
    app.get('/downloader/ytmp3/qualities', async (req, res) => {
        try {
            const { url } = req.query;

            if (!url) {
                return res.status(400).json({
                    status: 400,
                    creator: "api.vreden.my.id",
                    error: "Parameter url diperlukan"
                });
            }

            const apiUrl = `${vredenAPI.baseUrl}${vredenAPI.endpoints.ytmp3}${encodeURIComponent(url)}`;
            const response = await axios.get(apiUrl, {
                headers: vredenAPI.headers,
                timeout: 30000
            });

            const data = response.data;

            res.json({
                status: 200,
                creator: "api.vreden.my.id",
                result: {
                    videoId: data.id || null,
                    title: data.title || null,
                    availableQualities: data.download?.availableQuality || [92, 128, 256, 320],
                    currentQuality: data.download?.quality || data.quality || "128kbps",
                    downloadUrl: data.download?.url || data.url || data.dl_url || null
                }
            });

        } catch (error) {
            res.status(500).json({
                status: 500,
                creator: "api.vreden.my.id",
                error: "Failed to get qualities",
                message: error.message
            });
        }
    });

    // Endpoint: Bulk search (multiple queries)
    app.get('/downloader/ytmp3/bulk', async (req, res) => {
        try {
            const { queries } = req.query;

            if (!queries) {
                return res.status(400).json({
                    status: 400,
                    creator: "api.vreden.my.id",
                    error: "Parameter queries diperlukan",
                    example: "/downloader/ytmp3/bulk?queries=alan walker,ed sheeran,maroon 5"
                });
            }

            const queryList = queries.split(',').map(q => q.trim()).filter(q => q);
            const results = [];

            for (const query of queryList.slice(0, 3)) { // Max 3 queries
                try {
                    const apiUrl = `${vredenAPI.baseUrl}${vredenAPI.endpoints.ytplaymp3}${encodeURIComponent(query)}`;
                    const response = await axios.get(apiUrl, {
                        headers: vredenAPI.headers,
                        timeout: 15000
                    });

                    results.push(handleVredenResponse(response.data, query));
                } catch (error) {
                    results.push({
                        status: 500,
                        creator: "api.vreden.my.id",
                        error: error.message,
                        query: query
                    });
                }
            }

            res.json({
                status: 200,
                creator: "api.vreden.my.id",
                result: {
                    total_queries: queryList.length,
                    processed: results.length,
                    results: results
                }
            });

        } catch (error) {
            res.status(500).json({
                status: 500,
                creator: "api.vreden.my.id",
                error: "Bulk search failed",
                message: error.message
            });
        }
    });
};
