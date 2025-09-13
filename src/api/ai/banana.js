const axios = require("axios");
const FormData = require("form-data");
const crypto = require("crypto");
const fileTypeModule = require('file-type');
const qs = require('querystring');

module.exports = function(app) {
    // Konfigurasi Nano Banana AI
    const BASE_URL = "https://ai-apps.codergautam.dev";

    // Fungsi untuk upload ke Catbox CDN
    async function uploadToCDN(imageBuffer, filename) {
        try {
            const formData = new FormData();
            formData.append('reqtype', 'fileupload');
            formData.append('fileToUpload', imageBuffer, {
                filename: filename,
                contentType: 'image/jpeg'
            });

            const response = await axios.post('https://catbox.moe/user/api.php', formData, {
                headers: {
                    ...formData.getHeaders(),
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
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

    function acakName(len = 10) {
        const chars = "abcdefghijklmnopqrstuvwxyz";
        return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    }

    async function autoregist() {
        const uid = crypto.randomBytes(12).toString("hex");
        const email = `gienetic${Date.now()}@nyahoo.com`;

        const payload = {
            uid,
            email,
            displayName: acakName(),
            photoURL: "https://i.pravatar.cc/150",
            appId: "photogpt"
        };

        const res = await axios.post(`${BASE_URL}/photogpt/create-user`, payload, {
            headers: {
                "content-type": "application/json",
                "accept": "application/json",
                "user-agent": "okhttp/4.9.2"
            }
        });

        if (res.data.success) return uid;
        throw new Error("Register gagal: " + JSON.stringify(res.data));
    }

    async function img2img(imageBuffer, prompt) {
        const uid = await autoregist();

        const form = new FormData();
        form.append("image", imageBuffer, { filename: "input.jpg", contentType: "image/jpeg" });
        form.append("prompt", prompt);
        form.append("userId", uid);

        const uploadRes = await axios.post(`${BASE_URL}/photogpt/generate-image`, form, {
            headers: {
                ...form.getHeaders(),
                "accept": "application/json",
                "user-agent": "okhttp/4.9.2",
                "accept-encoding": "gzip"
            }
        });

        if (!uploadRes.data.success) throw new Error(JSON.stringify(uploadRes.data));

        const { pollingUrl } = uploadRes.data;
        let status = "pending";
        let resultUrl = null;

        // Polling dengan timeout 60 detik
        const startTime = Date.now();
        const timeout = 60000;

        while (status !== "Ready" && (Date.now() - startTime) < timeout) {
            const pollRes = await axios.get(pollingUrl, {
                headers: { "accept": "application/json", "user-agent": "okhttp/4.9.2" }
            });
            status = pollRes.data.status;
            if (status === "Ready") {
                resultUrl = pollRes.data.result.url;
                break;
            }
            await new Promise(r => setTimeout(r, 3000));
        }

        if (!resultUrl) throw new Error("Timeout: Gagal mendapatkan hasil gambar setelah 60 detik");

        const resultImg = await axios.get(resultUrl, { responseType: "arraybuffer" });
        return Buffer.from(resultImg.data);
    }

    // Endpoint: AI Image Editing - AUTO FILENAME
    app.get('/ai/image/edit', async (req, res) => {
        try {
            const { buffer, prompt } = req.query; // HAPUS filename parameter

            // Validasi parameter
            if (!buffer) {
                return res.status(400).json({
                    status: 400,
                    error: 'Parameter buffer diperlukan',
                    example: '/ai/image/edit?buffer=base64_string&prompt=make+it+anime+style'
                });
            }

            if (!prompt) {
                return res.status(400).json({
                    status: 400,
                    error: 'Parameter prompt diperlukan',
                    example: '/ai/image/edit?buffer=base64_string&prompt=make+it+cyberpunk+style'
                });
            }

            console.log(`🎨 AI Image Editing: "${prompt.substring(0, 50)}..."`);

            // Decode URL encoded buffer
            const decodedBuffer = decodeURIComponent(buffer);
            
            // Convert base64 to buffer
            let imageBuffer;
            try {
                if (decodedBuffer.startsWith('data:')) {
                    const base64Data = decodedBuffer.split(',')[1];
                    imageBuffer = Buffer.from(base64Data, 'base64');
                } else {
                    imageBuffer = Buffer.from(decodedBuffer, 'base64');
                }
            } catch (error) {
                return res.status(400).json({
                    status: 400,
                    error: 'Format buffer tidak valid'
                });
            }

            // Process image dengan AI
            const resultBuffer = await img2img(imageBuffer, prompt);
            const fileType = await fileTypeModule.fromBuffer(resultBuffer);
            
            // AUTO GENERATE FILENAME
            const finalFilename = `ai_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.${fileType.ext}`;

            // UPLOAD KE CDN
            console.log('📤 Uploading result to CDN...');
            const cdnUrl = await uploadToCDN(resultBuffer, finalFilename);
            console.log('✅ Uploaded to CDN:', cdnUrl);

            res.json({
                status: 200,
                creator: "DinzID & gienetic",
                result: {
                    success: true,
                    prompt: prompt,
                    filename: finalFilename,
                    mimeType: fileType.mime,
                    extension: fileType.ext,
                    size: resultBuffer.length,
                    cdnUrl: cdnUrl,
                    directUrl: cdnUrl,
                    timestamp: new Date().toISOString(),
                    note: "Gambar telah diupload ke CDN"
                }
            });

        } catch (error) {
            console.error('❌ AI Image Error:', error.message);
            
            res.status(500).json({
                status: 500,
                creator: "DinzID & gienetic",
                error: error.message,
                note: "AI processing mungkin timeout, coba lagi dengan prompt yang berbeda"
            });
        }
    });

    // Endpoint: AI Edit dari URL - AUTO FILENAME
    app.get('/ai/image/edit/url', async (req, res) => {
        try {
            const { url, prompt } = req.query; // HAPUS filename parameter

            if (!url) {
                return res.status(400).json({
                    status: 400,
                    error: 'Parameter url diperlukan',
                    example: '/ai/image/edit/url?url=https://example.com/photo.jpg&prompt=make+it+anime+style'
                });
            }

            if (!prompt) {
                return res.status(400).json({
                    status: 400,
                    error: 'Parameter prompt diperlukan',
                    example: '/ai/image/edit/url?url=https://example.com/photo.jpg&prompt=convert+to+anime+style'
                });
            }

            console.log(`🌐 Downloading image from: ${url}`);

            // Download image dari URL
            const responseDL = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            const imageBuffer = Buffer.from(responseDL.data);
            const fileType = await fileTypeModule.fromBuffer(imageBuffer);
            
            if (!fileType || !fileType.mime.startsWith('image/')) {
                throw new Error('File bukan gambar yang valid');
            }

            console.log(`🎨 AI Editing: "${prompt.substring(0, 50)}..."`);

            // Process dengan AI
            const resultBuffer = await img2img(imageBuffer, prompt);
            const resultFileType = await fileTypeModule.fromBuffer(resultBuffer);
            
            // AUTO GENERATE FILENAME
            const finalFilename = `ai_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.${resultFileType.ext}`;

            // UPLOAD KE CDN
            console.log('📤 Uploading result to CDN...');
            const cdnUrl = await uploadToCDN(resultBuffer, finalFilename);
            console.log('✅ Uploaded to CDN:', cdnUrl);

            res.json({
                status: 200,
                creator: "DinzID & gienetic",
                result: {
                    success: true,
                    originalUrl: url,
                    prompt: prompt,
                    filename: finalFilename,
                    mimeType: resultFileType.mime,
                    extension: resultFileType.ext,
                    size: resultBuffer.length,
                    cdnUrl: cdnUrl,
                    directUrl: cdnUrl,
                    timestamp: new Date().toISOString(),
                    note: "Gambar telah diupload ke CDN"
                }
            });

        } catch (error) {
            console.error('❌ AI URL Edit Error:', error.message);
            
            res.status(500).json({
                status: 500,
                creator: "DinzID & gienetic",
                error: error.message
            });
        }
    });

    // Endpoint: Test AI dengan sample image - AUTO FILENAME
    app.get('/ai/image/test', async (req, res) => {
        try {
            const { prompt = "make it anime style" } = req.query;

            // Sample image base64 (1x1 pixel transparent)
            const sampleImage = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
            
            const imageBuffer = Buffer.from(sampleImage, 'base64');
            
            console.log(`🧪 Test AI dengan prompt: "${prompt}"`);

            const resultBuffer = await img2img(imageBuffer, prompt);
            const fileType = await fileTypeModule.fromBuffer(resultBuffer);

            // AUTO GENERATE FILENAME
            const finalFilename = `test_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.${fileType.ext}`;

            // UPLOAD KE CDN
            console.log('📤 Uploading test result to CDN...');
            const cdnUrl = await uploadToCDN(resultBuffer, finalFilename);
            console.log('✅ Uploaded to CDN:', cdnUrl);

            res.json({
                status: 200,
                creator: "DinzID & gienetic",
                result: {
                    success: true,
                    prompt: prompt,
                    test: true,
                    filename: finalFilename,
                    mimeType: fileType.mime,
                    size: resultBuffer.length,
                    cdnUrl: cdnUrl,
                    directUrl: cdnUrl,
                    message: "Test AI berhasil!",
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            res.status(500).json({
                status: 500,
                creator: "DinzID & gienetic",
                error: error.message,
                note: "AI service mungkin down atau timeout"
            });
        }
    });

    // Endpoint: Info AI Image Editing
    app.get('/ai/image/info', (req, res) => {
        res.json({
            status: 200,
            creator: "DinzID & gienetic",
            service: "Nano Banana AI Image Editor + CDN",
            source: "https://play.google.com/store/apps/details?id=com.codergautamyt.photogpt",
            features: [
                "AI-powered image editing",
                "Style transfer",
                "Image enhancement",
                "Text-to-image editing",
                "Automatic CDN upload",
                "Direct image URLs",
                "Auto-generated filenames"
            ],
            endpoints: {
                edit: "GET /ai/image/edit?buffer=&prompt=",
                edit_from_url: "GET /ai/image/edit/url?url=&prompt=",
                test: "GET /ai/image/test?prompt=",
                info: "GET /ai/image/info"
            },
            parameters: {
                buffer: "Base64 image string (URL encoded, required)",
                url: "Image URL (required for URL method)",
                prompt: "AI instructions (required)"
            },
            examples: {
                edit: "/ai/image/edit?buffer=base64_string&prompt=make+it+cyberpunk+style",
                edit_url: "/ai/image/edit/url?url=https://example.com/photo.jpg&prompt=convert+to+anime+style",
                test: "/ai/image/test?prompt=make+it+vintage+style"
            },
            limits: {
                timeout: "60 seconds",
                max_size: "10MB",
                formats: "JPG, PNG, WebP",
                cdn: "catbox.moe"
            }
        });
    });

    // Endpoint: Health check
    app.get('/ai/image/health', async (req, res) => {
        try {
            const sampleImage = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
            const imageBuffer = Buffer.from(sampleImage, 'base64');

            // Test registrasi
            const uid = await autoregist();
            
            // Test CDN upload
            const cdnUrl = await uploadToCDN(imageBuffer, 'healthcheck.png');
            
            res.json({
                status: 200,
                creator: "DinzID & gienetic",
                health: "healthy",
                service: "Nano Banana AI + CDN",
                registration: "success",
                cdn: "working",
                cdnUrl: cdnUrl,
                uid: uid,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            res.json({
                status: 500,
                creator: "DinzID & gienetic",
                health: "unhealthy",
                error: error.message
            });
        }
    });
};
