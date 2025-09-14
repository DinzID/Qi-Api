const axios = require("axios");
const fileType = require('file-type');

module.exports = function(app) {
    const BASE_URL = "https://api-faa-skuarta2.vercel.app/faa";

    // Daftar semua filter yang tersedia
    const filters = {
        toturky: { name: "Turkey Filter", description: "Efek gaya Turki" },
        toghibli: { name: "Ghibli Filter", description: "Gaya anime Studio Ghibli" },
        tomekah: { name: "Mekah Filter", description: "Efek gaya Mekah" },
        toanime: { name: "Anime Filter", description: "Gaya anime umum" },
        tobotak: { name: "Botak Filter", description: "Membuat rambut botak" },
        tobrewok: { name: "Brewok Filter", description: "Menambahkan jenggot" },
        tochibi: { name: "Chibi Filter", description: "Gaya chibi imut" },
        todubai: { name: "Dubai Filter", description: "Efek gaya Dubai" },
        tofigura: { name: "Figura Filter", description: "Efek figura" },
        tofigurav2: { name: "Figura V2 Filter", description: "Efek figura versi 2" },
        tofigurav3: { name: "Figura V3 Filter", description: "Efek figura versi 3" },
        tohijab: { name: "Hijab Filter", description: "Menambahkan hijab" },
        tohitam: { name: "Hitam Filter", description: "Efek hitam" },
        tojepang: { name: "Jepang Filter", description: "Gaya Jepang" },
        tokacamata: { name: "Kacamata Filter", description: "Menambahkan kacamata" },
        tokamboja: { name: "Kamboja Filter", description: "Efek gaya Kamboja" },
        tolego: { name: "Lego Filter", description: "Gaya lego" },
        tomaya: { name: "Maya Filter", description: "Efek suku Maya" },
        tomoai: { name: "Moai Filter", description: "Efek patung Moai" },
        tomonyet: { name: "Monyet Filter", description: "Efek monyet" },
        topacar: { name: "Pacar Filter", description: "Efek pacar" },
        topacarv2: { name: "Pacar V2 Filter", description: "Efek pacar versi 2" },
        topiramida: { name: "Piramida Filter", description: "Efek piramida" },
        topolaroid: { name: "Polaroid Filter", description: "Efek polaroid" },
        toputih: { name: "Putih Filter", description: "Efek putih" },
        toreal: { name: "Real Filter", description: "Efek realistik" },
        toroblox: { name: "Roblox Filter", description: "Gaya Roblox" },
        tosdmtinggi: { name: "SDM Tinggi Filter", description: "Efek professional" },
        tosingapura: { name: "Singapura Filter", description: "Efek gaya Singapura" },
        totua: { name: "Tua Filter", description: "Membuat wajah tua" },
        tozombie: { name: "Zombie Filter", description: "Efek zombie" }
    };

    // Fungsi upload ke CDN
    async function uploadToCDN(imageBuffer, filename) {
        try {
            const FormData = require('form-data');
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

    // Endpoint utama untuk semua filter
    app.get('/ai/filter/:filterName', async (req, res) => {
        try {
            const { filterName } = req.params;
            const { url } = req.query;

            if (!url) {
                return res.status(400).json({
                    status: 400,
                    error: 'Parameter url diperlukan',
                    example: `/ai/filter/${filterName}?url=https://example.com/image.jpg`
                });
            }

            // Cek jika filter tersedia
            if (!filters[filterName]) {
                return res.status(404).json({
                    status: 404,
                    error: 'Filter tidak ditemukan',
                    available_filters: Object.keys(filters)
                });
            }

            const filter = filters[filterName];
            console.log(`🎨 Applying ${filter.name} to: ${url}`);

            // Download gambar dari URL
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

            // Process dengan filter Faa
            const apiUrl = `${BASE_URL}/${filterName}?url=${encodeURIComponent(url)}`;
            console.log(`🔗 Calling Faa API: ${apiUrl}`);

            const filterResponse = await axios.get(apiUrl, {
                responseType: 'arraybuffer',
                timeout: 60000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'image/*'
                }
            });

            const resultBuffer = Buffer.from(filterResponse.data);
            const resultFileType = await fileType.fromBuffer(resultBuffer);

            // Upload ke CDN
            const finalFilename = `${filterName}_${Date.now()}.${resultFileType.ext}`;
            console.log('📤 Uploading to CDN...');
            const cdnUrl = await uploadToCDN(resultBuffer, finalFilename);
            console.log('✅ Uploaded to CDN:', cdnUrl);

            res.json({
                status: 200,
                creator: "DinzID",
                result: {
                    success: true,
                    filter: filterName,
                    filter_name: filter.name,
                    description: filter.description,
                    filename: finalFilename,
                    mimeType: resultFileType.mime,
                    size: resultBuffer.length,
                    cdnUrl: cdnUrl,
                    directUrl: cdnUrl,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error(`❌ ${req.params.filterName} Error:`, error.message);
            
            res.status(500).json({
                status: 500,
                error: error.message,
                solution: "Coba lagi dengan URL gambar yang berbeda"
            });
        }
    });

    // Endpoint: List semua filter
    app.get('/ai/filter', (req, res) => {
        const filterList = Object.entries(filters).map(([key, filter]) => ({
            name: key,
            display_name: filter.name,
            description: filter.description,
            endpoint: `/ai/filter/${key}?url=IMAGE_URL`
        }));

        res.json({
            status: 200,
            total_filters: filterList.length,
            filters: filterList
        });
    });

    // Endpoint: Info filter spesifik
    app.get('/ai/filter/info/:filterName', (req, res) => {
        const { filterName } = req.params;
        
        if (!filters[filterName]) {
            return res.status(404).json({
                status: 404,
                error: 'Filter tidak ditemukan',
                available_filters: Object.keys(filters)
            });
        }

        const filter = filters[filterName];
        
        res.json({
            status: 200,
            filter: {
                name: filterName,
                display_name: filter.name,
                description: filter.description,
                api_url: `${BASE_URL}/${filterName}?url=IMAGE_URL`,
                endpoint: `/ai/filter/${filterName}?url=IMAGE_URL`
            }
        });
    });

    // Endpoint: Test filter
    app.get('/ai/filter/test/:filterName', async (req, res) => {
        try {
            const { filterName } = req.params;
            
            if (!filters[filterName]) {
                return res.status(404).json({
                    status: 404,
                    error: 'Filter tidak ditemukan'
                });
            }

            // Test dengan sample image
            const testImage = "https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg";
            const apiUrl = `${BASE_URL}/${filterName}?url=${encodeURIComponent(testImage)}`;

            const response = await axios.get(apiUrl, {
                responseType: 'arraybuffer',
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            const filter = filters[filterName];
            
            res.json({
                status: 200,
                filter: filterName,
                display_name: filter.name,
                test_url: apiUrl,
                working: response.status === 200,
                content_type: response.headers['content-type'],
                content_length: response.data.length
            });

        } catch (error) {
            res.json({
                status: 500,
                filter: req.params.filterName,
                working: false,
                error: error.message
            });
        }
    });
};
