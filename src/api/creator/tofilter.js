const axios = require("axios");
const FormData = require("form-data");
const crypto = require("crypto");
const { fileTypeFromBuffer } = require('file-type');

module.exports = function(app) {
    // Konfigurasi Nano Banana AI
    const BASE_URL = "https://ai-apps.codergautam.dev";

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

    // Endpoint: AI Image Editing
    app.post('/ai/image/edit', async (req, res) => {
        try {
            const { buffer, prompt, filename } = req.body;

            // Validasi parameter
            if (!buffer) {
                return res.status(400).json({
                    status: 400,
                    error: 'Parameter buffer diperlukan',
                    example: {
                        "buffer": "base64_string",
                        "prompt": "make it anime style",
                        "filename": "image.jpg"
                    }
                });
            }

            if (!prompt) {
                return res.status(400).json({
                    status: 400,
                    error: 'Parameter prompt diperlukan',
                    example: "make it cyberpunk style, add sunglasses, background beach"
                });
            }

            console.log(`🎨 AI Image Editing: "${prompt.substring(0, 50)}..."`);

            // Convert base64 to buffer
            let imageBuffer;
            try {
                if (buffer.startsWith('data:')) {
                    const base64Data = buffer.split(',')[1];
                    imageBuffer = Buffer.from(base64Data, 'base64');
                } else {
                    imageBuffer = Buffer.from(buffer, 'base64');
                }
            } catch (error) {
                return res.status(400).json({
                    status: 400,
                    error: 'Format buffer tidak valid'
                });
            }

            // Process image dengan AI
            const resultBuffer = await img2img(imageBuffer, prompt);
            const fileType = await fileTypeFromBuffer(resultBuffer);
            const finalFilename = filename || `ai_edited_${Date.now()}.${fileType.ext}`;

            // Convert result ke base64 untuk response
            const base64Result = resultBuffer.toString('base64');

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
                    image: `data:${fileType.mime};base64,${base64Result}`,
                    timestamp: new Date().toISOString()
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

    // Endpoint: AI Edit dari URL
    app.post('/ai/image/edit/url', async (req, res) => {
        try {
            const { url, prompt, filename } = req.body;

            if (!url) {
                return res.status(400).json({
                    status: 400,
                    error: 'Parameter url diperlukan'
                });
            }

            if (!prompt) {
                return res.status(400).json({
                    status: 400,
                    error: 'Parameter prompt diperlukan'
                });
            }

            console.log(`🌐 Downloading image from: ${url}`);

            // Download image dari URL
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            const imageBuffer = Buffer.from(response.data);
            const fileType = await fileTypeFromBuffer(imageBuffer);
            
            if (!fileType || !fileType.mime.startsWith('image/')) {
                throw new Error('File bukan gambar yang valid');
            }

            console.log(`🎨 AI Editing: "${prompt.substring(0, 50)}..."`);

            // Process dengan AI
            const resultBuffer = await img2img(imageBuffer, prompt);
            const resultFileType = await fileTypeFromBuffer(resultBuffer);
            const finalFilename = filename || `ai_edited_${Date.now()}.${resultFileType.ext}`;

            const base64Result = resultBuffer.toString('base64');

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
                    image: `data:${resultFileType.mime};base64,${base64Result}`,
                    timestamp: new Date().toISOString()
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

    // Endpoint: Test AI dengan sample image
    app.get('/ai/image/test', async (req, res) => {
        try {
            const { prompt = "make it anime style" } = req.query;

            // Sample image base64 (1x1 pixel transparent)
            const sampleImage = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
            
            const imageBuffer = Buffer.from(sampleImage, 'base64');
            
            console.log(`🧪 Test AI dengan prompt: "${prompt}"`);

            const resultBuffer = await img2img(imageBuffer, prompt);
            const fileType = await fileTypeFromBuffer(resultBuffer);
            const base64Result = resultBuffer.toString('base64');

            res.json({
                status: 200,
                creator: "DinzID & gienetic",
                result: {
                    success: true,
                    prompt: prompt,
                    test: true,
                    filename: `test_${Date.now()}.${fileType.ext}`,
                    mimeType: fileType.mime,
                    size: resultBuffer.length,
                    image: `data:${fileType.mime};base64,${base64Result}`,
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
            service: "Nano Banana AI Image Editor",
            source: "https://play.google.com/store/apps/details?id=com.codergautamyt.photogpt",
            features: [
                "AI-powered image editing",
                "Style transfer",
                "Image enhancement",
                "Text-to-image editing",
                "Real-time processing"
            ],
            endpoints: {
                edit: "POST /ai/image/edit",
                edit_from_url: "POST /ai/image/edit/url",
                test: "GET /ai/image/test",
                info: "GET /ai/image/info"
            },
            parameters: {
                buffer: "Base64 image string (required)",
                url: "Image URL (optional alternative to buffer)",
                prompt: "AI instructions (required)",
                filename: "Output filename (optional)"
            },
            examples: {
                edit: {
                    "buffer": "base64_string",
                    "prompt": "make it cyberpunk style with neon lights",
                    "filename": "cyberpunk.jpg"
                },
                edit_url: {
                    "url": "https://example.com/photo.jpg",
                    "prompt": "convert to anime style",
                    "filename": "anime_version.png"
                },
                test: "/ai/image/test?prompt=make it vintage style"
            },
            limits: {
                timeout: "60 seconds",
                max_size: "10MB",
                formats: "JPG, PNG, WebP"
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
            
            res.json({
                status: 200,
                creator: "DinzID & gienetic",
                health: "healthy",
                service: "Nano Banana AI",
                registration: "success",
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
