const axios = require('axios');

module.exports = function(app) {
    // Konfigurasi API Filter
    const filterAPI = {
        baseUrl: 'https://api-faa-skuarta2.vercel.app/faa',
        endpoints: {
    topacar: '/topacar?url=',
    toghibli: '/toghibli?url=',
    tofigura: '/tofigura?url=',
    tobabi: '/tobabi?url=',
    tobotak: '/tobotak?url=',
    tobrewok: '/tobrewok?url=',
    tohijab: '/tohijab?url=',
    tolego: '/tolego?url=',
    tohitam: '/tohitam?url=',
    tokacamata: '/tokacamata?url=',
    toputih: '/toputih?url=',
    topeci: '/topeci?url=',
    tosdmtinggi: '/tosdmtinggi?url=',
    topunk: '/topunk?url=',
    toreal: '/toreal?url=',
    totua: '/totua?url=',
    tozombie: '/tozombie?url=',
    toanime: '/toanime?url=',
    tochibi: '/tochibi?url=',
    todubai: '/todubai?url=',
    tofigurav2: '/tofigurav2?url=',
    tofigurav3: '/tofigurav3?url=',
    tojepang: '/tojepang?url=',
    tokacamata: '/tokacamata?url=',
    tokamboja: '/tokamboja?url=',
    tomaya: '/tomaya?url=',
    tomoai: '/tomoa?url=',
    tomonyet: '/tomonyet?url=',
    topacarv2: '/topacarv2?url=',
    topiramida: '/topiramida?url=',
    topolaroid: '/topolaroid?url=',
    toroblox: '/toroblox?url=',
    tosingapura: '/tosingapura?url=',
    tomekah: '/tomekah?url=',
    toturky: '/toturky?url='
        },
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'image/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Connection': 'keep-alive'
        }
    };

    // Daftar filter yang tersedia
    const availableFilters = {
        'topacar': {
            name: 'Pacar Filter',
            description: 'Efek romantic couple - foto single menjadi berpasangan',
            category: 'Relationship'
        },
        'toghibli': {
            name: 'Ghibli Filter', 
            description: 'Gaya anime Studio Ghibli yang aesthetic',
            category: 'Anime'
        },
        'tofigura': {
            name: 'Figura Filter',
            description: 'Efek figura atau bingkai foto',
            category: 'Frame'
        },
        'tobabi': {
            name: 'Baby Filter',
            description: 'Membuat wajah terlihat seperti bayi lucu',
            category: 'Fun'
        },
        'tobotak': {
            name: 'Botak Filter',
            description: 'Membuat rambut menjadi botak',
            category: 'Style'
        },
        'tobrewok': {
            name: 'Brewok Filter',
            description: 'Menambahkan jenggot dan brewok',
            category: 'Beard'
        },
        'tohijab': {
            name: 'Hijab Filter',
            description: 'Menambahkan hijab pada foto',
            category: 'Religion'
        },
        'tolego': {
            name: 'Lego Filter',
            description: 'Mengubah wajah menjadi karakter lego',
            category: 'Fun'
        },
        'tohitam': {
            name: 'Hitam Filter',
            description: 'Filter efek hitam dan gelap',
            category: 'Color'
        },
        'tokacamatai': {
            name: 'Kacamata Filter',
            description: 'Menambahkan kacamata pada wajah',
            category: 'Accessory'
        },
        'toputih': {
            name: 'Putih Filter',
            description: 'Filter efek putih dan terang',
            category: 'Color'
        },
        'topeci': {
            name: 'Peci Filter',
            description: 'Menambahkan peci/songkok',
            category: 'Religion'
        },
        'tosdmtinggi': {
            name: 'SDM Tinggi Filter',
            description: 'Efek professional',
            category: 'Professional'
        },
        'topunk': {
            name: 'Punk Filter',
            description: 'Gaya punk rock',
            category: 'Style'
        },
        'toreal': {
            name: 'Real Filter',
            description: 'Efek realistik',
            category: 'Enhancement'
        },
        'totua': {
            name: 'Tua Filter',
            description: 'Membuat wajah terlihat lebih tua',
            category: 'Age'
        },
        'tozombie': {
            name: 'Zombie Filter',
            description: 'Efek zombie horror',
            category: 'Horror'
        }
    };

    // Helper function
    function handleFilterResponse(data, filterName, imageUrl) {
        return {
            status: 200,
            creator: "DinzID",
            result: {
                filter: filterName,
                filterName: availableFilters[filterName]?.name || filterName,
                description: availableFilters[filterName]?.description || '',
                category: availableFilters[filterName]?.category || 'Unknown',
                originalImage: imageUrl,
                filteredImage: data, // Binary image data
                timestamp: new Date().toISOString()
            }
        };
    }

    // Endpoint: Apply filter
    app.get('/filter/apply', async (req, res) => {
        try {
            const { filter, url } = req.query;

            // Validasi parameter
            if (!filter) {
                return res.status(400).json({
                    status: 400,
                    error: 'Parameter filter diperlukan',
                    example: '/filter/apply?filter=toghibli&url=https://example.com/image.jpg',
                    availableFilters: Object.keys(availableFilters)
                });
            }

            if (!url) {
                return res.status(400).json({
                    status: 400,
                    error: 'Parameter url diperlukan',
                    example: '/filter/apply?filter=toghibli&url=https://example.com/image.jpg'
                });
            }

            // Validasi filter
            if (!availableFilters[filter]) {
                return res.status(400).json({
                    status: 400,
                    error: `Filter '${filter}' tidak ditemukan`,
                    availableFilters: Object.keys(availableFilters)
                });
            }

            console.log(`🎨 Applying ${filter} filter to: ${url}`);

            const apiUrl = `${filterAPI.baseUrl}${filterAPI.endpoints[filter]}${encodeURIComponent(url)}`;
            
            const response = await axios.get(apiUrl, {
                headers: filterAPI.headers,
                responseType: 'arraybuffer',
                timeout: 30000
            });

            // Set headers untuk image response
            const contentType = response.headers['content-type'] || 'image/jpeg';
            res.setHeader('Content-Type', contentType);
            res.setHeader('X-Filter-Name', availableFilters[filter].name);
            res.setHeader('X-Filter-Category', availableFilters[filter].category);
            res.setHeader('Cache-Control', 'public, max-age=3600');

            // Langsung kirim binary image
            res.send(response.data);

        } catch (error) {
            console.error('❌ Filter Error:', error.message);
            
            res.status(500).json({
                status: 500,
                creator: "DinzID",
                error: 'Gagal memproses filter',
                message: error.message,
                solution: 'Pastikan URL gambar valid dan dapat diakses'
            });
        }
    });

    // Endpoint: Apply filter dengan JSON response
    app.get('/filter/apply/json', async (req, res) => {
        try {
            const { filter, url } = req.query;

            if (!filter || !url) {
                return res.status(400).json({
                    status: 400,
                    error: 'Parameter filter dan url diperlukan'
                });
            }

            if (!availableFilters[filter]) {
                return res.status(400).json({
                    status: 400,
                    error: `Filter '${filter}' tidak ditemukan`
                });
            }

            const apiUrl = `${filterAPI.baseUrl}${filterAPI.endpoints[filter]}${encodeURIComponent(url)}`;
            
            const response = await axios.get(apiUrl, {
                headers: filterAPI.headers,
                responseType: 'arraybuffer',
                timeout: 30000
            });

            // Convert image to base64 untuk JSON response
            const base64Image = Buffer.from(response.data).toString('base64');
            const contentType = response.headers['content-type'] || 'image/jpeg';

            res.json({
                status: 200,
                creator: "DinzID",
                result: {
                    filter: filter,
                    filterName: availableFilters[filter].name,
                    description: availableFilters[filter].description,
                    category: availableFilters[filter].category,
                    originalImage: url,
                    image: `data:${contentType};base64,${base64Image}`,
                    mimeType: contentType,
                    size: response.data.length,
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            res.status(500).json({
                status: 500,
                creator: "DinzID",
                error: error.message
            });
        }
    });

    // Endpoint: List semua filter
    app.get('/filter/list', (req, res) => {
        const filterList = Object.entries(availableFilters).map(([id, info]) => ({
            id: id,
            name: info.name,
            description: info.description,
            category: info.category,
            endpoint: `/filter/apply?filter=${id}&url=[image_url]`,
            example: `${filterAPI.baseUrl}${filterAPI.endpoints[id]}[image_url]`
        }));

        res.json({
            status: 200,
            creator: "DinzID",
            totalFilters: filterList.length,
            filters: filterList
        });
    });

    // Endpoint: Info filter spesifik
    app.get('/filter/info', (req, res) => {
        const { filter } = req.query;

        if (!filter) {
            return res.status(400).json({
                status: 400,
                error: 'Parameter filter diperlukan',
                example: '/filter/info?filter=toghibli'
            });
        }

        if (!availableFilters[filter]) {
            return res.status(400).json({
                status: 400,
                error: `Filter '${filter}' tidak ditemukan`
            });
        }

        res.json({
            status: 200,
            creator: "DinzID",
            filter: {
                id: filter,
                ...availableFilters[filter],
                endpoint: `${filterAPI.baseUrl}${filterAPI.endpoints[filter]}[image_url]`,
                usage: `/filter/apply?filter=${filter}&url=[image_url]`
            }
        });
    });

    // Endpoint: Bulk apply filters
    app.get('/filter/bulk', async (req, res) => {
        try {
            const { url, filters } = req.query;

            if (!url) {
                return res.status(400).json({
                    status: 400,
                    error: 'Parameter url diperlukan'
                });
            }

            const filterList = filters ? filters.split(',') : Object.keys(availableFilters);
            const results = [];

            for (const filter of filterList.slice(0, 5)) { // Max 5 filters
                if (availableFilters[filter]) {
                    try {
                        const apiUrl = `${filterAPI.baseUrl}${filterAPI.endpoints[filter]}${encodeURIComponent(url)}`;
                        const response = await axios.get(apiUrl, {
                            headers: filterAPI.headers,
                            responseType: 'arraybuffer',
                            timeout: 30000
                        });

                        const base64Image = Buffer.from(response.data).toString('base64');
                        
                        results.push({
                            filter: filter,
                            success: true,
                            name: availableFilters[filter].name,
                            image: `data:image/jpeg;base64,${base64Image}`
                        });
                    } catch (error) {
                        results.push({
                            filter: filter,
                            success: false,
                            error: error.message
                        });
                    }
                }
            }

            res.json({
                status: 200,
                creator: "DinzID",
                originalImage: url,
                results: results
            });

        } catch (error) {
            res.status(500).json({
                status: 500,
                creator: "DinzID",
                error: error.message
            });
        }
    });

    // Endpoint: Health check
    app.get('/filter/health', async (req, res) => {
        try {
            const testUrl = 'https://raw.githubusercontent.com/DinzID/nyoba/main/images/image_1757635262110_xkacib.jpg';
            const testFilter = 'toghibli';
            
            const apiUrl = `${filterAPI.baseUrl}${filterAPI.endpoints[testFilter]}${encodeURIComponent(testUrl)}`;
            const response = await axios.get(apiUrl, {
                headers: filterAPI.headers,
                timeout: 15000,
                validateStatus: () => true
            });

            res.json({
                status: 200,
                creator: "DinzID",
                health: response.status === 200 ? 'healthy' : 'unhealthy',
                responseStatus: response.status,
                testFilter: testFilter,
                testImage: testUrl,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            res.json({
                status: 500,
                creator: "DinzID",
                health: 'unhealthy',
                error: error.message
            });
        }
    });
};
