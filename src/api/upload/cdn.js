const FormData = require('form-data');
const { fileTypeFromBuffer } = require('file-type');
const fetch = require('node-fetch');
const fs = require('fs');

module.exports = function(app) {
    // Konfigurasi Catbox
    const catboxAPI = {
        baseUrl: 'https://catbox.moe/user/api.php',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    };

    // Fungsi upload ke Catbox
    async function uploadToCatbox(buffer, filename = null) {
        try {
            // Deteksi file type
            const fileType = await fileTypeFromBuffer(buffer);
            if (!fileType) {
                throw new Error('Gagal mendeteksi tipe file dari buffer');
            }

            const finalFilename = filename || `file_${Date.now()}.${fileType.ext}`;

            console.log(`📤 Uploading to Catbox: ${finalFilename}`);

            // Siapkan form data
            const formData = new FormData();
            formData.append('reqtype', 'fileupload');
            formData.append('userhash', ''); // Optional: untuk registered users
            formData.append('fileToUpload', buffer, {
                filename: finalFilename,
                contentType: fileType.mime
            });

            // Kirim request ke Catbox
            const response = await fetch(catboxAPI.baseUrl, {
                method: 'POST',
                body: formData,
                headers: {
                    ...formData.getHeaders(),
                    'User-Agent': catboxAPI.headers['User-Agent']
                }
            });

            if (!response.ok) {
                throw new Error(`Catbox upload failed: ${response.status} ${response.statusText}`);
            }

            const fileUrl = await response.text();

            if (!fileUrl.startsWith('http')) {
                throw new Error('Invalid response from Catbox');
            }

            return {
                success: true,
                service: 'catbox',
                filename: finalFilename,
                mimeType: fileType.mime,
                extension: fileType.ext,
                size: buffer.length,
                url: fileUrl,
                directUrl: fileUrl,
                deleteUrl: null, // Catbox tidak提供 delete URL
                uploadedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('Catbox Upload Error:', error.message);
            throw error;
        }
    }

    // Endpoint: Upload file ke Catbox (Base64)
    app.post('/upload/catbox', async (req, res) => {
        try {
            const { buffer, filename } = req.body;

            if (!buffer) {
                return res.status(400).json({
                    status: 400,
                    error: 'Buffer file diperlukan',
                    example: {
                        "buffer": "base64_encoded_string",
                        "filename": "image.png"
                    }
                });
            }

            // Convert base64 to buffer
            let fileBuffer;
            if (typeof buffer === 'string') {
                if (buffer.startsWith('data:')) {
                    const base64Data = buffer.split(',')[1];
                    fileBuffer = Buffer.from(base64Data, 'base64');
                } else {
                    fileBuffer = Buffer.from(buffer, 'base64');
                }
            } else {
                return res.status(400).json({
                    status: 400,
                    error: 'Format buffer tidak valid'
                });
            }

            console.log(`📤 Catbox upload: ${filename || 'unknown'}, size: ${fileBuffer.length} bytes`);

            const result = await uploadToCatbox(fileBuffer, filename);

            res.json({
                status: 200,
                creator: "DinzID",
                result: result
            });

        } catch (error) {
            console.error('Catbox Upload Error:', error.message);
            
            res.status(500).json({
                status: 500,
                creator: "DinzID",
                error: error.message
            });
        }
    });

    // Endpoint: Upload dari URL ke Catbox
    app.post('/upload/catbox/url', async (req, res) => {
        try {
            const { url, filename } = req.body;

            if (!url) {
                return res.status(400).json({
                    status: 400,
                    error: 'Parameter url diperlukan'
                });
            }

            console.log(`🌐 Downloading from URL: ${url}`);

            // Download file dari URL
            const response = await fetch(url, {
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            if (!response.ok) {
                throw new Error(`Download failed: ${response.status} ${response.statusText}`);
            }

            const buffer = await response.buffer();
            const finalFilename = filename || url.split('/').pop() || `file_${Date.now()}`;

            console.log(`✅ Downloaded: ${finalFilename}, size: ${buffer.length} bytes`);

            const result = await uploadToCatbox(buffer, finalFilename);

            res.json({
                status: 200,
                creator: "DinzID",
                result: result
            });

        } catch (error) {
            console.error('Catbox URL Upload Error:', error.message);
            
            res.status(500).json({
                status: 500,
                creator: "DinzID",
                error: error.message
            });
        }
    });

    // Endpoint: Quick upload (GET method - untuk testing)
    app.get('/upload/catbox/quick', async (req, res) => {
        try {
            // Test dengan small image
            const testBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
            
            const result = await uploadToCatbox(testBuffer, 'test.png');
            
            res.json({
                status: 200,
                creator: "DinzID",
                result: result,
                message: "Test upload berhasil!"
            });

        } catch (error) {
            res.status(500).json({
                status: 500,
                creator: "DinzID",
                error: error.message
            });
        }
    });

    // Endpoint: Info Catbox
    app.get('/upload/catbox/info', (req, res) => {
        res.json({
            status: 200,
            creator: "DinzID",
            service: "Catbox.moe File Hosting",
            features: [
                "Free image hosting",
                "No registration required",
                "Direct links",
                "Fast CDN",
                "No rate limiting (reasonable use)"
            ],
            limits: {
                file_size: "20MB per file",
                file_types: "All image and video types",
                retention: "Permanent (unless violated TOS)"
            },
            endpoints: {
                upload: "POST /upload/catbox",
                upload_from_url: "POST /upload/catbox/url",
                quick_test: "GET /upload/catbox/quick",
                info: "GET /upload/catbox/info"
            },
            examples: {
                upload: {
                    "buffer": "base64_encoded_string",
                    "filename": "image.png"
                },
                upload_from_url: {
                    "url": "https://example.com/image.jpg",
                    "filename": "downloaded.jpg"
                }
            }
        });
    });

    // Endpoint: Health check
    app.get('/upload/catbox/health', async (req, res) => {
        try {
            const testBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
            
            const result = await uploadToCatbox(testBuffer, 'healthcheck.png');
            
            res.json({
                status: 200,
                creator: "DinzID",
                health: "healthy",
                service: "catbox",
                test_url: result.url,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            res.json({
                status: 500,
                creator: "DinzID",
                health: "unhealthy",
                error: error.message
            });
        }
    });
};
