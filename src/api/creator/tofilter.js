const axios = require('axios');

module.exports = function(app) {
    // Daftar semua filter dengan deskripsi lengkap
    const filters = {
        '1': {
            id: '1',
            name: 'tobabi',
            description: '🤱 Baby Filter - Membuat wajah terlihat seperti bayi lucu',
            example: 'Wajah dewasa menjadi seperti bayi',
            category: 'Fun',
            url: 'https://api-faa-skuarta.vercel.app/faa/tobabi?url='
        },
        '2': {
            id: '2', 
            name: 'tobotak',
            description: '👨‍🦲 Botak Filter - Membuat rambut menjadi botak',
            example: 'Rambut panjang menjadi botak',
            category: 'Style',
            url: 'https://api-faa-skuarta.vercel.app/faa/tobotak?url='
        },
        '3': {
            id: '3',
            name: 'tobrewok',
            description: '🧔 Brewok Filter - Menambahkan jenggot dan brewok',
            example: 'Wajah bersih menjadi berjenggot',
            category: 'Beard',
            url: 'https://api-faa-skuarta.vercel.app/faa/tobrewok?url='
        },
        '4': {
            id: '4',
            name: 'tohijab',
            description: '🧕 Hijab Filter - Menambahkan hijab pada foto',
            example: 'Wanita tanpa hijab menjadi berhijab',
            category: 'Religion',
            url: 'https://api-faa-skuarta.vercel.app/faa/tohijab?url='
        },
        '5': {
            id: '5',
            name: 'toghibli',
            description: '🎨 Ghibli Filter - Gaya anime Studio Ghibli yang aesthetic',
            example: 'Foto biasa menjadi anime style',
            category: 'Anime',
            url: 'https://api-faa-skuarta.vercel.app/faa/toghibli?url='
        },
        '6': {
            id: '6',
            name: 'tolego',
            description: '🧱 Lego Filter - Mengubah wajah menjadi karakter lego',
            example: 'Wajah manusia menjadi lego',
            category: 'Fun',
            url: 'https://api-faa-skuarta.vercel.app/faa/tolego?url='
        },
        '7': {
            id: '7',
            name: 'tohitam',
            description: '⚫ Hitam Filter - Filter efek hitam dan gelap',
            example: 'Foto normal menjadi hitam putih gelap',
            category: 'Color',
            url: 'https://api-faa-skuarta.vercel.app/faa/tohitam?url='
        },
        '8': {
            id: '8',
            name: 'tokacamatai',
            description: '👓 Kacamata Filter - Menambahkan kacamata pada wajah',
            example: 'Wajah tanpa kacamata menjadi berkacamata',
            category: 'Accessory',
            url: 'https://api-faa-skuarta.vercel.app/faa/tokacamatai?url='
        },
        '9': {
            id: '9',
            name: 'toputih',
            description: '⚪ Putih Filter - Filter efek putih dan terang',
            example: 'Foto normal menjadi putih terang',
            category: 'Color',
            url: 'https://api-faa-skuarta.vercel.app/faa/toputih?url='
        },
        '10': {
            id: '10',
            name: 'topacar',
            description: '💑 Pacar Filter - Efek romantic couple',
            example: 'Foto single menjadi berpasangan',
            category: 'Relationship',
            url: 'https://api-faa-skuarta.vercel.app/faa/topacar?url='
        },
        '11': {
            id: '11',
            name: 'topeci',
            description: '👳 Peci Filter - Menambahkan peci/songkok',
            example: 'Kepala tanpa peci menjadi berpeci',
            category: 'Religion',
            url: 'https://api-faa-skuarta.vercel.app/faa/topeci?url='
        },
        '12': {
            id: '12',
            name: 'tosdmtinggi',
            description: '📈 SDM Tinggi Filter - Efek professional',
            example: 'Foto biasa menjadi professional',
            category: 'Professional',
            url: 'https://api-faa-skuarta.vercel.app/faa/tosdmtinggi?url='
        },
        '13': {
            id: '13',
            name: 'topunk',
            description: '🤘 Punk Filter - Gaya punk rock',
            example: 'Penampilan normal menjadi punk',
            category: 'Style',
            url: 'https://api-faa-skuarta.vercel.app/faa/topunk?url='
        },
        '14': {
            id: '14',
            name: 'toreal',
            description: '🖼️ Real Filter - Efek realistik',
            example: 'Foto menjadi lebih realistik',
            category: 'Enhancement',
            url: 'https://api-faa-skuarta.vercel.app/faa/toreal?url='
        },
        '15': {
            id: '15',
            name: 'totua',
            description: '👴 Tua Filter - Membuat wajah terlihat lebih tua',
            example: 'Wajah muda menjadi tua',
            category: 'Age',
            url: 'https://api-faa-skuarta.vercel.app/faa/totua?url='
        },
        '16': {
            id: '16',
            name: 'tozombie',
            description: '🧟 Zombie Filter - Efek zombie horror',
            example: 'Wajah normal menjadi zombie',
            category: 'Horror',
            url: 'https://api-faa-skuarta.vercel.app/faa/tozombie?url='
        }
    };

    // Main endpoint dengan pilihan method
    app.get('/creator/filter', async (req, res) => {
        try {
            const { url, method, id } = req.query;

            // Validasi input
            if (!url) {
                return res.status(400).json({
                    status: false,
                    error: 'Parameter url diperlukan',
                    example: '/creator/filter?url=https://example.com/photo.jpg&method=toghibli'
                });
            }

            // Cari filter berdasarkan method atau id
            let filter;
            if (method) {
                filter = Object.values(filters).find(f => f.name === method);
            } else if (id) {
                filter = filters[id];
            } else {
                return res.status(400).json({
                    status: false,
                    error: 'Pilih method atau id',
                    example: '/creator/filter?url=https://example.com/photo.jpg&method=toghibli',
                    or: '/creator/filter?url=https://example.com/photo.jpg&id=5'
                });
            }

            if (!filter) {
                return res.status(404).json({
                    status: false,
                    error: 'Filter tidak ditemukan',
                    available_methods: Object.values(filters).map(f => f.name),
                    available_ids: Object.keys(filters)
                });
            }

            console.log(`🎨 Applying ${filter.name} filter (ID: ${filter.id})`);

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
            res.setHeader('X-Filter-ID', filter.id);
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

    // Endpoint untuk list semua filter
    app.get('/creator/filter/list', (req, res) => {
        const filterList = Object.values(filters).map(filter => ({
            id: filter.id,
            name: filter.name,
            description: filter.description,
            category: filter.category,
            example: filter.example,
            usage: `/creator/filter?url=[image_url]&method=${filter.name}`,
            usage_id: `/creator/filter?url=[image_url]&id=${filter.id}`
        }));

        res.json({
            status: true,
            total_filters: filterList.length,
            usage: {
                by_method: '/creator/filter?url=[image_url]&method=toghibli',
                by_id: '/creator/filter?url=[image_url]&id=5',
                list: '/creator/filter/list'
            },
            filters: filterList
        });
    });

    // Endpoint untuk info filter spesifik
    app.get('/creator/filter/info', (req, res) => {
        const { method, id } = req.query;
        
        let filter;
        if (method) {
            filter = Object.values(filters).find(f => f.name === method);
        } else if (id) {
            filter = filters[id];
        } else {
            return res.status(400).json({
                status: false,
                error: 'Pilih method atau id parameter',
                example: '/creator/filter/info?method=toghibli',
                or: '/creator/filter/info?id=5'
            });
        }

        if (!filter) {
            return res.status(404).json({
                status: false,
                error: 'Filter tidak ditemukan'
            });
        }

        res.json({
            status: true,
            filter: {
                id: filter.id,
                name: filter.name,
                description: filter.description,
                category: filter.category,
                example: filter.example,
                api_url: filter.url + '[image_url]',
                usage: `/creator/filter?url=[image_url]&method=${filter.name}`
            }
        });
    });

    // Health check
    app.get('/creator/filter/health', (req, res) => {
        res.json({
            status: true,
            message: 'Filter API is running',
            total_filters: Object.keys(filters).length,
            timestamp: new Date().toISOString()
        });
    });

    // Endpoint untuk test cepat
    app.get('/creator/filter/test', async (req, res) => {
        try {
            const { method, id } = req.query;
            const testUrl = 'https://via.placeholder.com/150';
            
            let filter;
            if (method) {
                filter = Object.values(filters).find(f => f.name === method);
            } else if (id) {
                filter = filters[id];
            } else {
                filter = filters['5']; // Default tohibli
            }

            if (!filter) {
                return res.status(404).json({ error: 'Filter not found' });
            }

            const apiUrl = `${filter.url}${encodeURIComponent(testUrl)}`;
            const response = await axios.get(apiUrl, {
                timeout: 15000,
                validateStatus: () => true
            });

            res.json({
                status: true,
                filter: filter.name,
                id: filter.id,
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
