const axios = require("axios");
const FormData = require("form-data");
const crypto = require("crypto");
const fileTypeModule = require('file-type');
const qs = require('querystring');

module.exports = function(app) {
    // Konfigurasi Nano Banana AI
    const BASE_URL = "https://ai-apps.codergautam.dev";

    // Multi-CDN Uploader dengan fallback
    async function uploadToMultiCDN(imageBuffer, filename) {
        const cdns = [
            {
                name: 'Catbox',
                url: 'https://catbox.moe/user/api.php',
                method: 'POST',
                formData: (form) => {
                    form.append('reqtype', 'fileupload');
                    form.append('fileToUpload', imageBuffer, { filename });
                },
                parseResponse: (response) => response.data.trim()
            },
            {
                name: 'Uguu',
                url: 'https://uguu.se/upload.php',
                method: 'POST',
                formData: (form) => {
                    form.append('file', imageBuffer, { filename });
                },
                parseResponse: (response) => response.data.files[0].url
            },
            {
                name: 'ImgBB',
                url: 'https://api.imgbb.com/1/upload?key=your_imgbb_key_here', // Ganti dengan key Anda
                method: 'POST',
                formData: (form) => {
                    form.append('image', imageBuffer.toString('base64'));
                },
                parseResponse: (response) => response.data.data.url
            },
            {
                name: 'FreeImageHost',
                url: 'https://freeimage.host/api/1/upload',
                method: 'POST',
                formData: (form) => {
                    form.append('key', '6d207e02198a847aa98d0a2a901485a5');
                    form.append('source', imageBuffer, { filename });
                    form.append('format', 'json');
                },
                parseResponse: (response) => response.data.image.url
            },
            {
                name: 'AnonymousFiles',
                url: 'https://api.anonymousfiles.io/',
                method: 'POST',
                formData: (form) => {
                    form.append('file', imageBuffer, { filename });
                },
                parseResponse: (response) => response.data.url
            }
        ];

        let lastError = null;

        for (const cdn of cdns) {
            try {
                console.log(`📤 Trying ${cdn.name} CDN...`);
                
                const formData = new FormData();
                cdn.formData(formData);

                const response = await axios({
                    method: cdn.method,
                    url: cdn.url,
                    data: formData,
                    headers: {
                        ...formData.getHeaders(),
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': '*/*'
                    },
                    timeout: 15000
                });

                const fileUrl = cdn.parseResponse(response);
                
                if (fileUrl && fileUrl.startsWith('http')) {
                    console.log(`✅ Success with ${cdn.name}: ${fileUrl}`);
                    return {
                        success: true,
                        cdn: cdn.name,
                        url: fileUrl
                    };
                }
            } catch (error) {
                console.error(`❌ ${cdn.name} failed:`, error.message);
                lastError = error;
                // Continue to next CDN
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        throw new Error(`All CDNs failed: ${lastError?.message || 'Unknown error'}`);
    }

    // Fungsi untuk convert GitHub URL ke CDN URL
    function convertGitHubToCDN(url) {
        if (url.includes('github.com') || url.includes('raw.githubusercontent.com')) {
            try {
                // Convert: https://raw.githubusercontent.com/user/repo/branch/path/to/image.jpg
                // To: https://cdn.jsdelivr.net/gh/user/repo@branch/path/to/image.jpg
                const match = url.match(/https:\/\/raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)\/([^\/]+)\/(.+)/);
                if (match) {
                    const [, user, repo, branch, path] = match;
                    return `https://cdn.jsdelivr.net/gh/${user}/${repo}@${branch}/${path}`;
                }
            } catch (e) {
                console.log('GitHub URL conversion failed, using original URL');
            }
        }
        return url;
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

    // Endpoint: AI Edit dari URL - MULTI CDN
    app.get('/ai/image/edit/url', async (req, res) => {
        try {
            const { url, prompt } = req.query;

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

            // Convert GitHub URL to CDN URL jika perlu
            const downloadUrl = convertGitHubToCDN(url);
            console.log(`🔗 Using download URL: ${downloadUrl}`);

            // Download image dari URL
            const responseDL = await axios.get(downloadUrl, {
                responseType: 'arraybuffer',
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                    'Referer': 'https://www.google.com/'
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

            // UPLOAD KE MULTI CDN
            console.log('📤 Uploading result to multiple CDNs...');
            const cdnResult = await uploadToMultiCDN(resultBuffer, finalFilename);
            console.log('✅ Uploaded to CDN:', cdnResult.url);

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
                    cdn: cdnResult.cdn,
                    cdnUrl: cdnResult.url,
                    directUrl: cdnResult.url,
                    timestamp: new Date().toISOString(),
                    note: `Gambar telah diupload ke ${cdnResult.cdn}`
                }
            });

        } catch (error) {
            console.error('❌ AI URL Edit Error:', error.message);
            
            res.status(500).json({
                status: 500,
                creator: "DinzID & gienetic",
                error: error.message,
                solution: "Coba gunakan URL dari image hosting seperti imgur, catbox, atau ibb"
            });
        }
    });

    // Endpoint: Info CDN
    app.get('/ai/image/cdn/info', (req, res) => {
        res.json({
            status: 200,
            creator: "DinzID",
            cdns: [
                {
                    name: "Catbox",
                    status: "active",
                    url: "https://catbox.moe/",
                    features: ["No registration", "Permanent storage", "Fast"]
                },
                {
                    name: "Uguu", 
                    status: "active",
                    url: "https://uguu.se/",
                    features: ["Temporary storage", "Simple API"]
                },
                {
                    name: "ImgBB",
                    status: "requires_key",
                    url: "https://imgbb.com/",
                    features: ["API key required", "Permanent storage"]
                },
                {
                    name: "FreeImageHost",
                    status: "active", 
                    url: "https://freeimage.host/",
                    features: ["Free", "API support"]
                },
                {
                    name: "AnonymousFiles",
                    status: "active",
                    url: "https://anonymousfiles.io/",
                    features: ["Anonymous", "Simple"]
                }
            ],
            note: "System akan mencoba semua CDN secara berurutan sampai berhasil"
        });
    });
};
