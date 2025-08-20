const axios = require('axios');

module.exports = function(app) {
    // Daftar semua filter dengan method name saja
    const filters = {
        'tobabi': {
            name: 'tobabi',
            description: '🤱 Baby Filter - Membuat wajah terlihat seperti bayi lucu',
            example: 'Wajah dewasa menjadi seperti bayi',
            category: 'Fun',
            url: 'https://api-faa-skuarta.vercel.app/faa/tobabi?url='
        },
        'tobotak': {
            name: 'tobotak',
            description: '👨‍🦲 Botak Filter - Membuat rambut menjadi botak',
            example: 'Rambut panjang menjadi botak',
            category: 'Style',
            url: 'https://api-faa-skuarta.vercel.app/faa/tobotak?url='
        },
        'tobrewok': {
            name: 'tobrewok',
            description: '🧔 Brewok Filter - Menambahkan jenggot dan brewok',
            example: 'Wajah bersih menjadi berjenggot',
            category: 'Beard',
            url: 'https://api-faa-skuarta.vercel.app/faa/tobrewok?url='
        },
        'tohijab': {
            name: 'tohijab',
            description: '🧕 Hijab Filter - Menambahkan hijab pada foto',
            example: 'Wanita tanpa hijab menjadi berhijab',
            category: 'Religion',
            url: 'https://api-faa-skuarta.vercel.app/faa/tohijab?url='
        },
        'toghibli': {
            name: 'toghibli',
            description: '🎨 Ghibli Filter - Gaya anime Studio Ghibli yang aesthetic',
            example: 'Foto biasa menjadi anime style',
            category: 'Anime',
            url: 'https://api-faa-skuarta.vercel.app/faa/toghibli?url='
        },
        'tolego': {
            name: 'tolego',
            description: '🧱 Lego Filter - Mengubah wajah menjadi karakter lego',
            example: 'Wajah manusia menjadi lego',
            category: 'Fun',
            url: 'https://api-faa-skuarta.vercel.app/faa/tolego?url='
        },
        'tohitam': {
            name: 'tohitam',
            description: '⚫ Hitam Filter - Filter efek hitam dan gelap',
            example: 'Foto normal menjadi hitam putih gelap',
            category: 'Color',
            url: 'https://api-faa-skuarta.vercel.app/faa/tohitam?url='
        },
        'tokacamatai': {
            name: 'tokacamatai',
            description: '👓 Kacamata Filter - Menambahkan kacamata pada wajah',
            example: 'Wajah tanpa kacamata menjadi berkacamata',
            category: 'Accessory',
            url: 'https://api-faa-skuarta.vercel.app/faa/tokacamatai?url='
        },
        'toputih': {
            name: 'toputih',
            description: '⚪ Putih Filter - Filter efek putih dan terang',
            example: 'Foto normal menjadi putih terang',
            category: 'Color',
            url: 'https://api-faa-skuarta.vercel.app/faa/toputih?url='
        },
        'topacar': {
            name: 'topacar',
            description: '💑 Pacar Filter - Efek romantic couple',
            example: 'Foto single menjadi berpasangan',
            category: 'Relationship',
            url: 'https://api-faa-skuarta.vercel.app/faa/topacar?url='
        },
        'topeci': {
            name: 'topeci',
            description: '👳 Peci Filter - Menambahkan peci/songkok',
            example: 'Kepala tanpa peci menjadi berpeci',
            category: 'Religion',
            url: 'https://api-faa-skuarta.vercel.app/faa/topeci?url='
        },
        'tosdmtinggi': {
            name: 'tosdmtinggi',
            description: '📈 SDM Tinggi Filter - Efek professional',
            example: 'Foto biasa menjadi professional',
            category: 'Professional',
            url: 'https://api-faa-skuarta.vercel.app/faa/tosdmtinggi?url='
        },
        'topunk': {
            name: 'topunk',
            description: '🤘 Punk Filter - Gaya punk rock',
            example: 'Penampilan normal menjadi punk',
            category: 'Style',
            url: 'https://api-faa-skuarta.vercel.app/faa/topunk?url='
        },
        'toreal': {
            name: 'toreal',
            description: '🖼️ Real Filter - Efek realistik',
            example: 'Foto menjadi lebih realistik',
            category: 'Enhancement',
            url: 'https://api-faa-skuarta.vercel.app/faa/toreal?url='
        },
        'totua': {
            name: 'totua',
            description: '👴 Tua Filter - Membuat wajah terlihat lebih tua',
            example: 'Wajah muda menjadi tua',
            category: 'Age',
            url: 'https://api-faa-skuarta.vercel.app/faa/totua?url='
        },
        'tozombie': {
            name: 'tozombie',
            description: '🧟 Zombie Filter - Efek zombie horror',
            example: 'Wajah normal menjadi zombie',
            category: 'Horror',
            url: 'https://api-faa-skuarta.vercel.app/faa/tozombie?url='
        }
    };

    // Main endpoint - hanya pakai method
    app.get('/creator/filter', async (req, res) => {
        try {
            const { url, method } = req.query;

            // Validasi input
            if (!url) {
                return res.status(400).json({
                    status: false,
                    error: 'Parameter url diperlukan',
                    example: '/creator/filter?url=https://example.com/photo.jpg&method=toghibli'
                });
            }

            if (!method) {
                return res.status(400).json({
                    status: false,
                    error: 'Parameter method diperlukan',
                    example: '/creator/filter?url=https://example.com/photo.jpg&method=toghibli',
                    available_methods: Object.keys(filters)
                });
            }

            const filter = filters[method];
            if (!filter) {
                return res.status(404).json({
                    status: false,
                    error: 'Method filter tidak ditemukan',
                    available_methods: Object.keys(filters)
                });
            }

            console.log(`🎨 Applying ${filter.name} filter`);

            const apiUrl = `${filter.url}${encodeURIComponent(url)}`;
            const response = await axios({
                method: 'GET',
                url: apiUrl,
                responseType: 'arraybuffer',
                timeout: 25000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'image/*'
                }
            });

            const contentType = response.headers['content-type'] || 'image/jpeg';
            
            res.setHeader('Content-Type', contentType);
            res.setHeader('X-Filter-Name', filter.name);
            res.setHeader('X-Filter-Category', filter.category);
            res.setHeader('Cache-Control', 'public, max-age=1800');
            
            res.send(response.data);

        } catch (error) {
            console.error('❌ Filter Error:', error.message);
            
            res.status(500).json({
                status: false,
                error: 'Gagal memproses filter',
                message: error.message,
                solution: 'Coba dengan URL gambar yang berbeda'
            });
        }
    });

    // Endpoint untuk list semua method
    app.get('/creator/filter/list', (req, res) => {
        const filterList = Object.values(filters).map(filter => ({
            method: filter.name,
            description: filter.description,
            category: filter.category,
            example: filter.example,
            usage: `/creator/filter?url=[image_url]&method=${filter.name}`
        }));

        res.json({
            status: true,
            total_filters: filterList.length,
            usage: '/creator/filter?url=[image_url]&method=[method_name]',
            methods: filterList
        });
    });

    // Endpoint untuk info method spesifik
    app.get('/creator/filter/info', (req, res) => {
        const { method } = req.query;
        
        if (!method) {
            return res.status(400).json({
                status: false,
                error: 'Parameter method diperlukan',
                example: '/creator/filter/info?method=toghibli'
            });
        }

        const filter = filters[method];
        if (!filter) {
            return res.status(404).json({
                status: false,
                error: 'Method filter tidak ditemukan',
                available_methods: Object.keys(filters)
            });
        }

        res.json({
            status: true,
            method: filter.name,
            description: filter.description,
            category: filter.category,
            example: filter.example,
            api_url: filter.url + '[image_url]',
            usage: `/creator/filter?url=[image_url]&method=${filter.name}`
        });
    });

    // Health check
    app.get('/creator/filter/health', (req, res) => {
        res.json({
            status: true,
            message: 'Filter API is running',
            total_methods: Object.keys(filters).length,
            timestamp: new Date().toISOString()
        });
    });

    // Endpoint untuk test cepat
    app.get('/creator/filter/test', async (req, res) => {
        try {
            const { method } = req.query;
            const testUrl = 'https://via.placeholder.com/150';
            
            const filter = method ? filters[method] : filters['toghibli'];
            if (!filter) {
                return res.status(404).json({ 
                    error: 'Method not found',
                    available: Object.keys(filters)
                });
            }

            const apiUrl = `${filter.url}${encodeURIComponent(testUrl)}`;
            const response = await axios.get(apiUrl, {
                timeout: 15000,
                validateStatus: () => true
            });

            res.json({
                status: true,
                method: filter.name,
                response_status: response.status,
                content_type: response.headers['content-type'],
                content_length: response.data?.length
            });

        } catch (error) {
            res.json({
                status: false,
                error: error.message
            });
        }
    });
};
