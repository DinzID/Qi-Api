const axios = require("axios");
const FormData = require("form-data");
const crypto = require("crypto");
const fileTypeModule = require('file-type');

module.exports = function(app) {
    // Konfigurasi berdasarkan scraper FongsiDev
    const BASE_URL = "https://nanobanana.ai";

    // Generate fake IP headers seperti scraper
    function generateFakeIpHeaders() {
        const ipv4 = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
        return {
            "X-Forwarded-For": ipv4,
            "X-Originating-IP": ipv4,
            "X-Remote-IP": ipv4,
            "X-Remote-Addr": ipv4,
            "X-Host": ipv4,
            "X-Forwarded-Host": ipv4,
            "X-Connecting-IP": ipv4,
            "Client-IP": ipv4,
            "X-Client-IP": ipv4,
            "CF-Connecting-IP": ipv4,
            "Fastly-Client-IP": ipv4,
            "True-Client-IP": ipv4,
            "X-Real-IP": ipv4,
            "Forwarded": `for=${ipv4};proto=http;by=${ipv4}`,
            "X-Cluster-Client-IP": ipv4,
            "Via": `1.1 ${ipv4}`,
            "Fgsi": `ap-${ipv4}`,
            "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36"
        };
    }

    // Fungsi untuk upload ke CDN
    async function uploadToCDN(imageBuffer, filename) {
        try {
            const formData = new FormData();
            formData.append('reqtype', 'fileupload');
            formData.append('fileToUpload', imageBuffer, { filename });

            const response = await axios.post('https://catbox.moe/user/api.php', formData, {
                headers: {
                    ...formData.getHeaders(),
                    ...generateFakeIpHeaders()
                },
                timeout: 30000
            });

            if (response.data && response.data.startsWith('http')) {
                return response.data.trim();
            }
            throw new Error('Upload to CDN failed');
        } catch (error) {
            console.error('CDN Upload Error:', error.message);
            throw error;
        }
    }

    // Fungsi utama AI processing berdasarkan NanoBanana
    async function nanoBananaAI(imageBuffer, prompt) {
        try {
            const headers = {
                ...generateFakeIpHeaders(),
                'accept': '*/*',
                'accept-language': 'en-US,en;q=0.9,id;q=0.8',
                'content-type': 'application/json',
                'origin': 'https://nanobanana.ai',
                'referer': 'https://nanobanana.ai/'
            };

            // Step 1: Init session
            console.log('🔹 Initializing session...');
            const sessionRes = await axios.get(`${BASE_URL}/api/auth/session`, { headers });
            
            // Step 2: Get upload URL
            console.log('🔹 Getting upload URL...');
            const fileSize = imageBuffer.length;
            const uploadRes = await axios.post(`${BASE_URL}/api/get-upload-url`, {
                fileName: `ai_${Date.now()}.jpg`,
                contentType: 'image/jpeg',
                fileSize: fileSize
            }, { headers });

            const { uploadUrl, publicUrl } = uploadRes.data;

            // Step 3: Upload image
            console.log('🔹 Uploading image to nano banana...');
            await axios.put(uploadUrl, imageBuffer, {
                headers: { 'content-type': 'image/jpeg' }
            });

            // Step 4: Generate image
            console.log('🔹 Processing AI...');
            const generateRes = await axios.post(`${BASE_URL}/api/generate-image`, {
                prompt: prompt,
                styleId: "realistic",
                mode: "image",
                imageUrl: publicUrl,
                imageUrls: [publicUrl]
            }, { headers });

            const { taskId } = generateRes.data;

            // Step 5: Wait for result
            console.log('🔹 Waiting for AI result...');
            let result = null;
            let attempts = 0;
            const maxAttempts = 20; // 20 attempts * 3s = 60s timeout

            while (attempts < maxAttempts) {
                try {
                    const statusRes = await axios.get(`${BASE_URL}/api/generate-image/status`, {
                        params: { taskId },
                        headers
                    });

                    if (statusRes.data.status === 'completed') {
                        result = statusRes.data;
                        break;
                    } else if (statusRes.data.status === 'failed') {
                        throw new Error('AI processing failed');
                    }

                    await new Promise(resolve => setTimeout(resolve, 3000));
                    attempts++;
                } catch (error) {
                    if (attempts >= maxAttempts) throw error;
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    attempts++;
                }
            }

            if (!result) throw new Error('AI processing timeout');

            // Step 6: Download result
            console.log('🔹 Downloading result...');
            const resultImage = await axios.get(result.result.url, {
                responseType: 'arraybuffer',
                headers: { 'User-Agent': headers['User-Agent'] }
            });

            return Buffer.from(resultImage.data);

        } catch (error) {
            console.error('NanoBanana AI Error:', error.message);
            throw error;
        }
    }

    // Endpoint utama
    app.get('/ai/image/edit/url', async (req, res) => {
        try {
            const { url, prompt } = req.query;

            if (!url || !prompt) {
                return res.status(400).json({
                    status: 400,
                    error: 'Parameter url dan prompt diperlukan',
                    example: '/ai/image/edit/url?url=https://example.com/image.jpg&prompt=edit+this+image'
                });
            }

            console.log(`🌐 Downloading: ${url}`);

            // Download image dari URL
            const responseDL = await axios.get(url, {
                responseType: 'arraybuffer',
                headers: generateFakeIpHeaders(),
                timeout: 30000
            });

            const imageBuffer = Buffer.from(responseDL.data);
            const fileType = await fileTypeModule.fromBuffer(imageBuffer);
            
            if (!fileType?.mime.startsWith('image/')) {
                throw new Error('File bukan gambar yang valid');
            }

            console.log(`🎨 AI Processing: "${prompt.substring(0, 50)}..."`);

            // Process dengan NanoBanana AI
            const resultBuffer = await nanoBananaAI(imageBuffer, prompt);
            const resultFileType = await fileTypeModule.fromBuffer(resultBuffer);
            
            // Auto generate filename
            const finalFilename = `ai_${Date.now()}.${resultFileType.ext}`;

            // Upload to CDN
            console.log('📤 Uploading to CDN...');
            const cdnUrl = await uploadToCDN(resultBuffer, finalFilename);
            console.log('✅ Uploaded to CDN:', cdnUrl);

            res.json({
                status: 200,
                creator: "DinzID & FongsiDev",
                result: {
                    success: true,
                    prompt: prompt,
                    filename: finalFilename,
                    mimeType: resultFileType.mime,
                    size: resultBuffer.length,
                    cdnUrl: cdnUrl,
                    directUrl: cdnUrl,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('❌ Error:', error.message);
            
            res.status(500).json({
                status: 500,
                creator: "DinzID & FongsiDev",
                error: error.message,
                solution: "Coba lagi dalam beberapa saat atau gunakan URL yang berbeda"
            });
        }
    });

    // Endpoint info
    app.get('/ai/image/info', (req, res) => {
        res.json({
            status: 200,
            creator: "DinzID & FongsiDev",
            service: "NanoBanana AI Image Editor",
            source: "https://nanobanana.ai",
            endpoint: "/ai/image/edit/url?url=&prompt=",
            parameters: {
                url: "Image URL (required)",
                prompt: "AI instructions (required)"
            },
            example: "/ai/image/edit/url?url=https://example.com/image.jpg&prompt=make+it+anime+style"
        });
    });
};
