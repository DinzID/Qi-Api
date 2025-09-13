const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { fileTypeFromBuffer } = require('file-type');

module.exports = function(app) {
    let apiKey = null;
    let lastScrapeTime = 0;
    const KEY_VALIDITY = 30 * 60 * 1000;

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

    async function scrapeApiKey() {
        try {
            if (apiKey && Date.now() - lastScrapeTime < KEY_VALIDITY) {
                console.log('✅ Using cached API Key');
                return apiKey;
            }

            console.log('🔑 Scraping new API Key...');
            const targetUrl = 'https://overchat.ai/image/ghibli';
            
            const { data: htmlContent } = await axios.get(targetUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 15000
            });

            const apiKeyRegex = /const apiKey = '([^']+)'/;
            const match = htmlContent.match(apiKeyRegex);
            
            if (match && match[1]) {
                apiKey = match[1];
                lastScrapeTime = Date.now();
                console.log('✅ New API Key scraped successfully');
                return apiKey;
            } else {
                throw new Error('API Key not found in page source');
            }
        } catch (error) {
            console.error('❌ API Key scrape failed:', error.message);
            throw new Error('Failed to get API Key: ' + error.message);
        }
    }

    async function createGhibliImage(imageBuffer, prompt) {
        try {
            const apiKey = await scrapeApiKey();
            const apiUrl = 'https://api.openai.com/v1/images/edits';

            const form = new FormData();
            form.append('image', imageBuffer, { 
                filename: `input_${Date.now()}.png`,
                contentType: 'image/png'
            });
            form.append('prompt', prompt);
            form.append('model', 'gpt-image-1');
            form.append('n', 1);
            form.append('size', '1024x1024');
            form.append('quality', 'medium');

            console.log('🎨 Sending request to OpenAI API...');

            const response = await axios.post(apiUrl, form, {
                headers: {
                    ...form.getHeaders(),
                    'Authorization': `Bearer ${apiKey}`,
                },
                timeout: 60000
            });

            const resultData = response.data;

            if (resultData.data && resultData.data[0] && resultData.data[0].b64_json) {
                const base64Image = resultData.data[0].b64_json;
                return Buffer.from(base64Image, 'base64');
            } else {
                throw new Error('Invalid API response format');
            }
        } catch (error) {
            console.error('❌ OpenAI API Error:', error.message);
            throw new Error('OpenAI processing failed: ' + error.message);
        }
    }

    // Endpoint: Create Art from URL - AUTO CDN UPLOAD
    app.get('/ai/art/convert', async (req, res) => {
        try {
            const { url, prompt } = req.query;

            if (!url) {
                return res.status(400).json({
                    status: 400,
                    error: 'Parameter url diperlukan',
                    example: '/ai/art/convert?url=https://example.com/image.png&prompt=anime+style'
                });
            }

            if (!prompt) {
                return res.status(400).json({
                    status: 400,
                    error: 'Parameter prompt diperlukan',
                    example: '/ai/art/convert?url=https://example.com/image.png&prompt=studio+ghibli+style'
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
            const fileType = await fileTypeFromBuffer(imageBuffer);

            if (!fileType || !fileType.mime.startsWith('image/')) {
                return res.status(400).json({
                    status: 400,
                    error: 'File bukan gambar yang valid'
                });
            }

            console.log(`🎨 Processing with prompt: "${prompt}"`);

            // Process dengan OpenAI
            const resultBuffer = await createGhibliImage(imageBuffer, prompt);
            const resultFileType = await fileTypeFromBuffer(resultBuffer);
            
            // AUTO UPLOAD KE CDN - NO BASE64 IN RESPONSE
            const finalFilename = `art_${Date.now()}.${resultFileType.ext}`;
            console.log('📤 Uploading to CDN...');
            const cdnUrl = await uploadToCDN(resultBuffer, finalFilename);
            console.log('✅ Uploaded to CDN:', cdnUrl);

            // RETURN JSON DENGAN URL CDN SAJA
            res.json({
                status: 200,
                creator: "DinzID",
                result: {
                    success: true,
                    prompt: prompt,
                    filename: finalFilename,
                    mimeType: resultFileType.mime,
                    size: resultBuffer.length,
                    cdnUrl: cdnUrl,
                    directUrl: cdnUrl,
                    timestamp: new Date().toISOString(),
                    note: "Gambar telah diupload ke CDN"
                }
            });

        } catch (error) {
            console.error('❌ Art Convert Error:', error.message);
            res.status(500).json({
                status: 500,
                error: error.message,
                solution: 'Coba lagi dalam beberapa saat'
            });
        }
    });

    // Endpoint: Create Art from base64 - AUTO CDN UPLOAD
    app.get('/ai/art/convert/base64', async (req, res) => {
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

            console.log(`🎨 Processing with prompt: "${prompt}"`);

            // Process dengan OpenAI
            const resultBuffer = await createGhibliImage(imageBuffer, prompt);
            const resultFileType = await fileTypeFromBuffer(resultBuffer);

            // AUTO UPLOAD KE CDN
            const finalFilename = `art_${Date.now()}.${resultFileType.ext}`;
            console.log('📤 Uploading to CDN...');
            const cdnUrl = await uploadToCDN(resultBuffer, finalFilename);
            console.log('✅ Uploaded to CDN:', cdnUrl);

            // RETURN JSON DENGAN URL CDN
            res.json({
                status: 200,
                creator: "DinzID",
                result: {
                    success: true,
                    prompt: prompt,
                    filename: finalFilename,
                    mimeType: resultFileType.mime,
                    size: resultBuffer.length,
                    cdnUrl: cdnUrl,
                    directUrl: cdnUrl,
                    timestamp: new Date().toISOString(),
                    note: "Gambar telah diupload ke CDN"
                }
            });

        } catch (error) {
            console.error('❌ Art Convert Base64 Error:', error.message);
            res.status(500).json({
                status: 500,
                error: error.message
            });
        }
    });

    // Endpoint: Info
    app.get('/ai/art/info', (req, res) => {
        res.json({
            status: 200,
            service: "AI Art Style Converter",
            description: "Convert images to any art style using OpenAI + Auto CDN Upload",
            endpoints: {
                from_url: "/ai/art/convert?url=URL&prompt=PROMPT",
                from_base64: "/ai/art/convert/base64?buffer=BASE64&prompt=PROMPT",
                info: "/ai/art/info"
            },
            parameters: {
                url: "Image URL",
                buffer: "Base64 image data", 
                prompt: "Art style description (required)"
            },
            examples: {
                ghibli: "/ai/art/convert?url=...&prompt=studio+ghibli+style",
                cyberpunk: "/ai/art/convert?url=...&prompt=cyberpunk+neon+style",
                anime: "/ai/art/convert?url=...&prompt=anime+style+with+bright+colors",
                disney: "/ai/art/convert?url=...&prompt=disney+cartoon+style"
            },
            features: [
                "Any art style support",
                "Auto CDN upload", 
                "No base64 in response",
                "Direct image URLs"
            ]
        });
    });
};
