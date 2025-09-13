const axios = require("axios");
const FormData = require("form-data");
const crypto = require("crypto");
const fileType = require('file-type');

module.exports = function(app) {
    const BASE_URL = "https://ai-apps.codergautam.dev";

    function acakName(len = 10) {
        const chars = "abcdefghijklmnopqrstuvwxyz";
        return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    }

    async function autoregist() {
        const uid = crypto.randomBytes(12).toString("hex");
        const email = `gienetic${Date.now()}@gmail.com`;
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

    async function img2img(imageBuffer, prompt, pollInterval = 3000, pollTimeout = 120000) {
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
            },
            timeout: 120000
        });

        if (!uploadRes.data.success) throw new Error(JSON.stringify(uploadRes.data));

        const pollingUrl = uploadRes.data.pollingUrl || (uploadRes.data.jobId ? `${BASE_URL}/photogpt/job/${uploadRes.data.jobId}` : null);
        if (!pollingUrl) throw new Error("Polling URL tidak ditemukan.");

        let status = "pending";
        let resultUrl = null;
        const startTime = Date.now();

        while (true) {
            if (Date.now() - startTime > pollTimeout) throw new Error("Polling timeout.");
            
            const pollRes = await axios.get(pollingUrl, {
                headers: { 
                    "accept": "application/json", 
                    "user-agent": "okhttp/4.9.2" 
                }
            });

            status = (pollRes.data.status || "").toLowerCase();
            
            if (status === "ready" || status === "complete" || status === "success") {
                resultUrl = pollRes.data.result?.url || pollRes.data.url;
                if (!resultUrl) throw new Error("Job selesai tapi URL gambar tidak ditemukan.");
                break;
            }
            
            await new Promise(r => setTimeout(r, pollInterval));
        }

        const resultImg = await axios.get(resultUrl, { 
            responseType: "arraybuffer",
            timeout: 30000
        });
        
        return Buffer.from(resultImg.data);
    }

    // Fungsi upload ke CDN
    async function uploadToCDN(imageBuffer, filename) {
        try {
            const formData = new FormData();
            formData.append('reqtype', 'fileupload');
            formData.append('fileToUpload', imageBuffer, { filename });

            const response = await axios.post('https://catbox.moe/user/api.php', formData, {
                headers: formData.getHeaders(),
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

    // Endpoint: Nano Banana AI from URL
    app.get('/ai/nanobanana/url', async (req, res) => {
        try {
            const { url, prompt } = req.query;

            if (!url) {
                return res.status(400).json({
                    status: 400,
                    error: 'Parameter url diperlukan',
                    example: '/ai/nanobanana/url?url=https://example.com/image.jpg&prompt=anime+style'
                });
            }

            if (!prompt) {
                return res.status(400).json({
                    status: 400,
                    error: 'Parameter prompt diperlukan',
                    example: '/ai/nanobanana/url?url=https://example.com/image.jpg&prompt=studio+ghibli+style'
                });
            }

            console.log(`🌐 Downloading image from: ${url}`);

            // Download image
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            const imageBuffer = Buffer.from(response.data);
            const fileTypeInfo = await fileType.fromBuffer(imageBuffer);

            if (!fileTypeInfo || !fileTypeInfo.mime.startsWith('image/')) {
                return res.status(400).json({
                    status: 400,
                    error: 'File bukan gambar yang valid'
                });
            }

            console.log(`🎨 Nano Banana AI Processing: "${prompt}"`);

            // Process dengan Nano Banana AI
            const resultBuffer = await img2img(imageBuffer, prompt);
            const resultFileType = await fileType.fromBuffer(resultBuffer);
            
            // Auto upload ke CDN
            const finalFilename = `nanobanana_${Date.now()}.${resultFileType.ext}`;
            console.log('📤 Uploading to CDN...');
            const cdnUrl = await uploadToCDN(resultBuffer, finalFilename);
            console.log('✅ Uploaded to CDN:', cdnUrl);

            res.json({
                status: 200,
                creator: "DinzID & gienetic",
                source: "Nano Banana AI",
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
            console.error('❌ Nano Banana AI Error:', error.message);
            res.status(500).json({
                status: 500,
                creator: "DinzID & gienetic",
                error: error.message,
                note: "Coba lagi dengan prompt yang berbeda"
            });
        }
    });

    // Endpoint: Nano Banana AI from base64
    app.get('/ai/nanobanana/base64', async (req, res) => {
        try {
            const { buffer, prompt } = req.query;

            if (!buffer) {
                return res.status(400).json({
                    status: 400,
                    error: 'Parameter buffer diperlukan'
                });
            }

            if (!prompt) {
                return res.status(400).json({
                    status: 400,
                    error: 'Parameter prompt diperlukan'
                });
            }

            // Decode base64
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
                    error: 'Format base64 tidak valid'
                });
            }

            console.log(`🎨 Nano Banana AI Processing: "${prompt}"`);

            // Process dengan Nano Banana AI
            const resultBuffer = await img2img(imageBuffer, prompt);
            const resultFileType = await fileType.fromBuffer(resultBuffer);

            // Auto upload ke CDN
            const finalFilename = `nanobanana_${Date.now()}.${resultFileType.ext}`;
            console.log('📤 Uploading to CDN...');
            const cdnUrl = await uploadToCDN(resultBuffer, finalFilename);
            console.log('✅ Uploaded to CDN:', cdnUrl);

            res.json({
                status: 200,
                creator: "DinzID & gienetic",
                source: "Nano Banana AI",
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
            console.error('❌ Nano Banana AI Base64 Error:', error.message);
            res.status(500).json({
                status: 500,
                error: error.message
            });
        }
    });

    // Endpoint: Info
    app.get('/ai/nanobanana/info', (req, res) => {
        res.json({
            status: 200,
            creator: "DinzID & gienetic",
            source: "Nano Banana AI (PhotoGPT)",
            description: "AI image editing using Nano Banana AI engine",
            reference: "https://play.google.com/store/apps/details?id=com.codergautamyt.photogpt",
            endpoints: {
                from_url: "/ai/nanobanana/url?url=URL&prompt=PROMPT",
                from_base64: "/ai/nanobanana/base64?buffer=BASE64&prompt=PROMPT",
                info: "/ai/nanobanana/info"
            },
            parameters: {
                url: "Image URL",
                buffer: "Base64 image data",
                prompt: "AI instructions (required)"
            },
            examples: {
                ghibli: "/ai/nanobanana/url?url=https://example.com/image.jpg&prompt=studio+ghibli+style",
                anime: "/ai/nanobanana/url?url=https://example.com/image.jpg&prompt=anime+style",
                cyberpunk: "/ai/nanobanana/url?url=https://example.com/image.jpg&prompt=cyberpunk+style"
            },
            features: [
                "Nano Banana AI engine",
                "Auto CDN upload",
                "No base64 in response",
                "Fast processing"
            ]
        });
    });
};
