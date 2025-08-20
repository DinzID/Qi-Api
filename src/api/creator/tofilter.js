const axios = require('axios');

module.exports = function(app) {
    // Daftar semua filter yang tersedia
    const filters = {
        tobabi: {
            name: 'Baby Filter',
            description: 'Membuat foto seperti bayi',
            url: 'https://api-faa-skuarta.vercel.app/faa/tobabi?url='
        },
        tobotak: {
            name: 'Botak Filter',
            description: 'Membuat foto menjadi botak',
            url: 'https://api-faa-skuarta.vercel.app/faa/tobotak?url='
        },
        tobrewok: {
            name: 'Brewok Filter',
            description: 'Menambahkan brewok/jenggot',
            url: 'https://api-faa-skuarta.vercel.app/faa/tobrewok?url='
        },
        tohijab: {
            name: 'Hijab Filter',
            description: 'Menambahkan hijab',
            url: 'https://api-faa-skuarta.vercel.app/faa/tohijab?url='
        },
        toghibli: {
            name: 'Ghibli Filter',
            description: 'Gaya anime Studio Ghibli',
            url: 'https://api-faa-skuarta.vercel.app/faa/toghibli?url='
        },
        tolego: {
            name: 'Lego Filter',
            description: 'Mengubah menjadi lego',
            url: 'https://api-faa-skuarta.vercel.app/faa/tolego?url='
        },
        tohitam: {
            name: 'Hitam Filter',
            description: 'Filter hitam',
            url: 'https://api-faa-skuarta.vercel.app/faa/tohitam?url='
        },
        tokacamatai: {
            name: 'Kacamata Filter',
            description: 'Menambahkan kacamata',
            url: 'https://api-faa-skuarta.vercel.app/faa/tokacamatai?url='
        },
        toputih: {
            name: 'Putih Filter',
            description: 'Filter putih',
            url: 'https://api-faa-skuarta.vercel.app/faa/toputih?url='
        },
        topacar: {
            name: 'Pacar Filter',
            description: 'Filter pacar',
            url: 'https://api-faa-skuarta.vercel.app/faa/topacar?url='
        },
        topeci: {
            name: 'Peci Filter',
            description: 'Menambahkan peci',
            url: 'https://api-faa-skuarta.vercel.app/faa/topeci?url='
        },
        tosdmtinggi: {
            name: 'SDM Tinggi Filter',
            description: 'Filter SDM tinggi',
            url: 'https://api-faa-skuarta.vercel.app/faa/tosdmtinggi?url='
        },
        topunk: {
            name: 'Punk Filter',
            description: 'Gaya punk',
            url: 'https://api-faa-skuarta.vercel.app/faa/topunk?url='
        },
        toreal: {
            name: 'Real Filter',
            description: 'Filter real',
            url: 'https://api-faa-skuarta.vercel.app/faa/toreal?url='
        },
        totua: {
            name: 'Tua Filter',
            description: 'Membuat foto menjadi tua',
            url: 'https://api-faa-skuarta.vercel.app/faa/totua?url='
        },
        tozombie: {
            name: 'Zombie Filter',
            description: 'Mengubah menjadi zombie',
            url: 'https://api-faa-skuarta.vercel.app/faa/tozombie?url='
        }
    };

    // Main endpoint untuk semua filter
    app.get('/creator/filter/:filterName', async (req, res) => {
        try {
            const { filterName } = req.params;
            const { url } = req.query;

            // Validasi input
            if (!url) {
                return res.status(400).json({
                    status: false,
                    error: 'Parameter url diperlukan',
                    example: `/creator/filter/${filterName}?url=https://example.com/photo.jpg`
                });
            }

            if (!filters[filterName]) {
                return res.status(404).json({
                    status: false,
                    error: 'Filter tidak ditemukan',
                    available_filters: Object.keys(filters)
                });
            }

            console.log(`🎨 Applying ${filterName} filter to:`, url);

            const filter = filters[filterName];
            const apiUrl = `${filter.url}${encodeURIComponent(url)}`;

            console.log('🔗 External API URL:', apiUrl);

            // Request ke API external
            const response = await axios({
                method: 'GET',
                url: apiUrl,
                responseType: 'arraybuffer',
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'image/*, */*'
                }
            });

            // Deteksi content type
            const contentType = response.headers['content-type'] || 'image/jpeg';
            console.log('✅ Filter applied successfully');
            console.log('📊 Content-Type:', contentType);
            console.log('📏 Content-Length:', response.data.length);

            // Set headers dan kirim image
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Length', response.data.length);
            res.setHeader('X-Filter-Name', filter.name);
            res.setHeader('X-Filter-Description', filter.description);
            res.setHeader('Cache-Control', 'public, max-age=3600');
            
            res.send(response.data);

        } catch (error) {
            console.error('❌ Filter API Error:', error.message);

            if (error.response) {
                res.status(error.response.status).json({
                    status: false,
                    error: 'External API error',
                    status_code: error.response.status,
                    details: 'Filter mungkin sedang tidak bekerja'
                });
            } else if (error.request) {
                res.status(408).json({
                    status: false,
                    error: 'Request timeout',
                    details: 'Server filter terlalu lama merespons'
                });
            } else {
                res.status(500).json({
                    status: false,
                    error: 'Internal server error',
                    details: error.message
                });
            }
        }
    });

    // Endpoint untuk apply multiple filters
    app.get('/creator/filter/multiple', async (req, res) => {
        try {
            const { url, filters: filterList } = req.query;

            if (!url || !filterList) {
                return res.status(400).json({
                    status: false,
                    error: 'Parameter url dan filters diperlukan',
                    example: '/creator/filter/multiple?url=https://example.com/photo.jpg&filters=toghibli,tozombie'
                });
            }

            const filterArray = filterList.split(',');
            const results = {};

            for (const filterName of filterArray) {
                if (filters[filterName]) {
                    try {
                        const filterUrl = `${filters[filterName].url}${encodeURIComponent(url)}`;
                        const response = await axios.get(filterUrl, {
                            responseType: 'arraybuffer',
                            timeout: 15000
                        });
                        
                        results[filterName] = {
                            status: 'success',
                            url: filterUrl,
                            content_type: response.headers['content-type']
                        };
                    } catch (error) {
                        results[filterName] = {
                            status: 'error',
                            error: error.message
                        };
                    }
                } else {
                    results[filterName] = {
                        status: 'error',
                        error: 'Filter not found'
                    };
                }
            }

            res.json({
                status: true,
                original_url: url,
                results: results
            });

        } catch (error) {
            res.status(500).json({
                status: false,
                error: error.message
            });
        }
    });

    // Endpoint untuk list semua filter
    app.get('/creator/filter', (req, res) => {
        const filterList = {};
        for (const [key, filter] of Object.entries(filters)) {
            filterList[key] = {
                name: filter.name,
                description: filter.description,
                endpoint: `/creator/filter/${key}?url=[image_url]`
            };
        }

        res.json({
            status: true,
            total_filters: Object.keys(filterList).length,
            filters: filterList
        });
    });

    // Health check untuk semua filter
    app.get('/creator/filter/health', async (req, res) => {
        try {
            const testUrl = 'https://via.placeholder.com/150'; // Test image
            const testResults = {};

            // Test 3 filter pertama
            const testFilters = Object.keys(filters).slice(0, 3);
            
            for (const filterName of testFilters) {
                try {
                    const filterUrl = `${filters[filterName].url}${encodeURIComponent(testUrl)}`;
                    const response = await axios.get(filterUrl, {
                        timeout: 10000,
                        validateStatus: () => true
                    });

                    testResults[filterName] = {
                        status: response.status,
                        content_type: response.headers['content-type'],
                        working: response.status === 200
                    };
                } catch (error) {
                    testResults[filterName] = {
                        status: 'error',
                        error: error.message,
                        working: false
                    };
                }
            }

            res.json({
                status: true,
                message: 'Filter API health check',
                test_results: testResults,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            res.json({
                status: false,
                error: error.message
            });
        }
    });

    // Demo endpoint dengan filter populer
    app.get('/creator/filter/demo/:filterName', async (req, res) => {
        try {
            const { filterName } = req.params;
            const demoImage = 'https://via.placeholder.com/300'; // Placeholder image

            if (!filters[filterName]) {
                return res.status(404).json({
                    status: false,
                    error: 'Filter tidak ditemukan'
                });
            }

            const apiUrl = `${filters[filterName].url}${encodeURIComponent(demoImage)}`;
            const response = await axios({
                method: 'GET',
                url: apiUrl,
                responseType: 'arraybuffer',
                timeout: 20000
            });

            res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
            res.send(response.data);

        } catch (error) {
            res.json({
                status: false,
                error: 'Demo failed',
                filter: filterName,
                message: error.message
            });
        }
    });
};
