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
    function handleVredenResponse(data) {
        // Debug: log data structure untuk melihat format sebenarnya
        console.log('Raw API Response:', JSON.stringify(data, null, 2));
        
        return {
            status: 200,
            creator: "DinzID",
            result: {
                status: data.status !== false,
                creator: data.creator || "@vreden/youtube_scraper",
                metadata: {
                    type: "video",
                    videoId: data.id || data.result?.id || null,
                    url: data.result?.url || `https://youtube.com/watch?v=${data.id || data.result?.id}`,
                    title: data.title || data.result?.title || null,
                    description: data.description || data.result?.description || null,
                    image: data.thumb || data.result?.thumb || data.result?.image || null,
                    thumbnail: data.thumb || data.result?.thumb || data.result?.thumbnail || null,
                    seconds: data.duration?.seconds || data.result?.duration?.seconds || parseInt(data.duration) || null,
                    timestamp: data.duration || data.result?.duration || null,
                    duration: {
                        seconds: data.duration?.seconds || data.result?.duration?.seconds || parseInt(data.duration) || null,
                        timestamp: data.duration || data.result?.duration || null
                    },
                    ago: data.uploaded || data.result?.ago || null,
                    views: data.views || data.result?.views || null,
                    author: {
                        name: data.channel || data.result?.author?.name || null,
                        url: data.result?.author?.url || null
                    }
                },
                download: {
                    status: data.url ? true : false,
                    quality: data.quality || "128kbps",
                    availableQuality: [92, 128, 256, 320],
                    url: data.url || data.dl_url || data.result?.url || null,
                    filename: data.filename || `${data.title || 'audio'} (${data.quality || '128kbps'}).mp3`
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

            console.log('API Response Structure:', Object.keys(response.data));
            
            const result = handleVredenResponse(response.data);
            res.json(result);

        } catch (error) {
            console.error('YTMP3 Search Error:', error.message);
            console.error('Error Response:', error.response?.data);

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

            console.log('Download API Response Structure:', Object.keys(response.data));
            
            const result = handleVredenResponse(response.data);
            res.json(result);

        } catch (error) {
            console.error('YTMP3 Download Error:', error.message);
            console.error('Error Response:', error.response?.data);

            res.status(500).json({
                status: 500,
                creator: "DinzID",
                error: "Download failed",
                message: error.message
            });
        }
    });

    // Endpoint sederhana untuk test langsung
    app.get('/downloader/ytmp3/test', async (req, res) => {
        try {
            // Test dengan URL langsung untuk melihat struktur response
            const testUrl = 'https://api.vreden.my.id/api/ytplaymp3?query=dj%20malam%20pagi';
            
            const response = await axios.get(testUrl, {
                headers: vredenAPI.headers,
                timeout: 15000
            });

            // Return raw response untuk debugging
            res.json({
                status: 200,
                creator: "DinzID",
                raw_response: response.data,
                structure: Object.keys(response.data),
                message: "Ini adalah raw response dari API untuk debugging"
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

    // Endpoint untuk test download
    app.get('/downloader/ytmp3/test-download', async (req, res) => {
        try {
            const testUrl = 'https://api.vreden.my.id/api/ytmp3?url=https://youtu.be/Wola2tvRHIE';
            
            const response = await axios.get(testUrl, {
                headers: vredenAPI.headers,
                timeout: 15000
            });

            res.json({
                status: 200,
                creator: "DinzID",
                raw_response: response.data,
                structure: Object.keys(response.data),
                message: "Raw response dari download API"
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
