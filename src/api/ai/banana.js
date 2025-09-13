const axios = require("axios");
const FormData = require("form-data");
const crypto = require("crypto");
const fileTypeModule = require('file-type');

module.exports = function(app) {
    const BASE_URL = "https://ai-apps.codergautam.dev";

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

    // Auto registrasi
    async function autoregist() {
        const uid = crypto.randomBytes(12).toString("hex");
        const payload = {
            uid,
            email: `gienetic${Date.now()}@nyahoo.com`,
            displayName: "ai_user",
            photoURL: "https://i.pravatar.cc/150",
            appId: "photogpt"
        };

        const res = await axios.post(`${BASE_URL}/photogpt/create-user`, payload, {
            headers: { "content-type": "application/json" }
        });

        if (res.data.success) return uid;
        throw new Error("Register gagal");
    }

    // AI Processing
    async function img2img(imageBuffer, prompt) {
        const uid = await autoregist();
        const form = new FormData();
        form.append("image", imageBuffer, { filename: "input.jpg" });
        form.append("prompt", prompt);
        form.append("userId", uid);

        const uploadRes = await axios.post(`${BASE_URL}/photogpt/generate-image`, form, {
            headers: form.getHeaders()
        });

        if (!uploadRes.data.success) throw new Error("AI processing failed");

        const { pollingUrl } = uploadRes.data;
        let status = "pending";
        let resultUrl = null;
        const startTime = Date.now();

        while (status !== "Ready" && (Date.now() - startTime) < 60000) {
            const pollRes = await axios.get(pollingUrl);
            status = pollRes.data.status;
            if (status === "Ready") {
                resultUrl = pollRes.data.result.url;
                break;
            }
            await new Promise(r => setTimeout(r, 3000));
        }

        if (!resultUrl) throw new Error("Timeout");
        const resultImg = await axios.get(resultUrl, { responseType: "arraybuffer" });
        return Buffer.from(resultImg.data);
    }

    // Endpoint utama - AUTO FILENAME
    app.get('/ai/image/edit/url', async (req, res) => {
        try {
            const { url, prompt } = req.query;

            if (!url || !prompt) {
                return res.status(400).json({
                    status: 400,
                    error: 'Parameter url dan prompt diperlukan'
                });
            }

            console.log(`🌐 Downloading: ${url}`);

            // Download image
            const responseDL = await axios.get(url, {
                responseType: 'arraybuffer',
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            const imageBuffer = Buffer.from(responseDL.data);
            const fileType = await fileTypeModule.fromBuffer(imageBuffer);
            
            if (!fileType?.mime.startsWith('image/')) {
                throw new Error('File bukan gambar');
            }

            console.log(`🎨 Processing: "${prompt.substring(0, 30)}..."`);

            // AI Processing
            const resultBuffer = await img2img(imageBuffer, prompt);
            const resultFileType = await fileTypeModule.fromBuffer(resultBuffer);
            
            // Auto generate filename
            const finalFilename = `ai_${Date.now()}.${resultFileType.ext}`;

            // Upload to CDN
            console.log('📤 Uploading to CDN...');
            const cdnUrl = await uploadToCDN(resultBuffer, finalFilename);
            console.log('✅ Uploaded:', cdnUrl);

            res.json({
                status: 200,
                result: {
                    success: true,
                    prompt: prompt,
                    filename: finalFilename,
                    mimeType: resultFileType.mime,
                    size: resultBuffer.length,
                    cdnUrl: cdnUrl,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('❌ Error:', error.message);
            res.status(500).json({
                status: 500,
                error: error.message
            });
        }
    });
};
