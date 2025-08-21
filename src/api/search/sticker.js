const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function(app) {
    class StickerPackScraper {
        constructor() {
            this.baseUrl = 'https://getstickerpack.com';
            this.headers = {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Connection': 'keep-alive'
            };
        }

        async searchStickerPacks(query) {
            try {
                const url = `${this.baseUrl}/stickers?query=${encodeURIComponent(query)}`;
                const response = await axios.get(url, {
                    headers: { ...this.headers, 'Referer': url },
                    timeout: 15000
                });

                const $ = cheerio.load(response.data);
                const stickerPacks = [];

                $('.sticker-pack-cols').each((_, element) => {
                    const $element = $(element);
                    const link = $element.find('a').attr('href');
                    const title = $element.find('.title').text().trim();
                    const username = $element.find('.username').text().trim();
                    const imageUrl = $element.find('img').attr('data-cfsrc') || $element.find('img').attr('src');
                    
                    if (link && title) {
                        stickerPacks.push({
                            title,
                            username,
                            link,
                            imageUrl,
                            id: link.split('/').pop()
                        });
                    }
                });

                return stickerPacks;
            } catch (error) {
                console.error('Search error:', error.message);
                throw new Error('Gagal mencari sticker pack');
            }
        }

        async getStickerPackDetails(packId) {
            try {
                const url = `${this.baseUrl}/stickers/${packId}`;
                const response = await axios.get(url, {
                    headers: { ...this.headers, 'Referer': url },
                    timeout: 15000
                });

                const $ = cheerio.load(response.data);
                const title = $('h1').text().trim();
                const username = $('h5 a').text().trim();
                const downloads = $('#stickerInstallBlock span').text().match(/Downloads: (\d+)/)?.[1] || '0';
                const description = $('#collapseAbout').text().trim();
                const trayIcon = $('.intro-content img').attr('data-cfsrc') || $('.intro-content img').attr('src');
                const installUrl = $('#installBtn').attr('data-href');

                const stickers = [];
                $('.sticker-image').each((index, element) => {
                    const $element = $(element);
                    const src = $element.attr('src');
                    const largeSrc = $element.attr('data-src-large');
                    const alt = $element.attr('alt');
                    
                    if (src) {
                        stickers.push({
                            index: index + 1,
                            thumbnailUrl: src,
                            fullUrl: largeSrc || src,
                            alt
                        });
                    }
                });

                return {
                    id: packId,
                    title,
                    username,
                    downloads: parseInt(downloads),
                    description,
                    trayIcon,
                    installUrl,
                    totalStickers: stickers.length,
                    stickers,
                    scrapedAt: new Date().toISOString()
                };
            } catch (error) {
                console.error('Details error:', error.message);
                throw new Error('Gagal mengambil detail sticker pack');
            }
        }

        async scrapeFirst(query) {
            const packs = await this.searchStickerPacks(query);
            if (!packs.length) return null;
            return await this.getStickerPackDetails(packs[0].id);
        }
    }

    const scraper = new StickerPackScraper();

    // Endpoint untuk search sticker packs
    app.get('/search/sticker/search', async (req, res) => {
        try {
            const { query } = req.query;

            if (!query) {
                return res.status(400).json({
                    status: false,
                    error: 'Parameter query diperlukan',
                    example: '/search/sticker/search?query=waguri'
                });
            }

            console.log(`🔍 Searching sticker packs for: ${query}`);

            const packs = await scraper.searchStickerPacks(query);

            res.json({
                status: true,
                query,
                total_results: packs.length,
                packs: packs.map(pack => ({
                    id: pack.id,
                    title: pack.title,
                    username: pack.username,
                    image_url: pack.imageUrl,
                    link: pack.link,
                    details_url: `/search/sticker/details/${pack.id}`
                })),
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Search API Error:', error.message);
            res.status(500).json({
                status: false,
                error: error.message,
                solution: 'Coba lagi dengan query yang berbeda'
            });
        }
    });

    // Endpoint untuk get sticker pack details
    app.get('/search/sticker/details/:packId', async (req, res) => {
        try {
            const { packId } = req.params;

            console.log(`📦 Getting details for pack: ${packId}`);

            const details = await scraper.getStickerPackDetails(packId);

            res.json({
                status: true,
                pack: {
                    id: details.id,
                    title: details.title,
                    username: details.username,
                    downloads: details.downloads,
                    description: details.description,
                    tray_icon: details.trayIcon,
                    install_url: details.installUrl,
                    total_stickers: details.totalStickers,
                    stickers: details.stickers.map(sticker => ({
                        number: sticker.index,
                        thumbnail: sticker.thumbnailUrl,
                        full_image: sticker.fullUrl,
                        alt: sticker.alt
                    }))
                },
                download_instructions: {
                    android: 'Klik install_url untuk install di WhatsApp',
                    ios: 'Simpan gambar dan tambah manual ke WhatsApp'
                },
                timestamp: details.scrapedAt
            });

        } catch (error) {
            console.error('Details API Error:', error.message);
            res.status(500).json({
                status: false,
                error: 'Gagal mengambil detail sticker pack',
                message: error.message,
                solution: 'Pastikan pack ID valid'
            });
        }
    });

    // Endpoint untuk quick search + details
    app.get('/search/sticker/quick', async (req, res) => {
        try {
            const { query } = req.query;

            if (!query) {
                return res.status(400).json({
                    status: false,
                    error: 'Parameter query diperlukan',
                    example: '/search/sticker/quick?query=anime'
                });
            }

            console.log(`⚡ Quick search for: ${query}`);

            const pack = await scraper.scrapeFirst(query);

            if (!pack) {
                return res.status(404).json({
                    status: false,
                    error: 'Tidak ada sticker pack ditemukan',
                    query
                });
            }

            res.json({
                status: true,
                query,
                pack: {
                    id: pack.id,
                    title: pack.title,
                    username: pack.username,
                    downloads: pack.downloads,
                    total_stickers: pack.totalStickers,
                    tray_icon: pack.trayIcon,
                    install_url: pack.installUrl,
                    sample_stickers: pack.stickers.slice(0, 5).map(sticker => ({
                        number: sticker.index,
                        image: sticker.fullUrl
                    })),
                    all_stickers: `/search/sticker/details/${pack.id}`
                },
                timestamp: pack.scrapedAt
            });

        } catch (error) {
            console.error('Quick API Error:', error.message);
            res.status(500).json({
                status: false,
                error: error.message
            });
        }
    });

    // Endpoint untuk popular stickers
    app.get('/search/sticker/popular', async (req, res) => {
        try {
            const popularQueries = [
                'anime', 'cute', 'animal', 'cartoon', 
                'funny', 'meme', 'love', 'game'
            ];

            const results = [];

            // Cari satu pack dari setiap kategori popular
            for (const query of popularQueries.slice(0, 4)) {
                try {
                    const pack = await scraper.scrapeFirst(query);
                    if (pack) {
                        results.push({
                            category: query,
                            pack: {
                                id: pack.id,
                                title: pack.title,
                                username: pack.username,
                                total_stickers: pack.totalStickers,
                                tray_icon: pack.trayIcon
                            }
                        });
                    }
                } catch (error) {
                    console.error(`Error for ${query}:`, error.message);
                }
            }

            res.json({
                status: true,
                popular_categories: popularQueries,
                results,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            res.status(500).json({
                status: false,
                error: 'Gagal mengambil sticker popular'
            });
        }
    });

    // Health check
    app.get('/search/sticker/health', async (req, res) => {
        try {
            // Test dengan query kecil
            const testPacks = await scraper.searchStickerPacks('test');
            
            res.json({
                status: true,
                message: 'Sticker API is healthy',
                base_url: 'https://getstickerpack.com',
                can_connect: testPacks !== undefined,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            res.json({
                status: false,
                error: 'Health check failed',
                message: error.message
            });
        }
    });

    // Info endpoint
    app.get('/search/sticker/info', (req, res) => {
        res.json({
            status: true,
            service: 'Sticker Pack Scraper API',
            version: '1.0',
            source: 'getstickerpack.com',
            endpoints: {
                search: '/search/sticker/search?query=',
                details: '/search/sticker/details/:packId',
                quick: '/search/sticker/quick?query=',
                popular: '/search/sticker/popular',
                health: '/search/sticker/health',
                info: '/search/sticker/info'
            },
            features: [
                'Search sticker packs',
                'Get pack details',
                'Download links',
                'High quality stickers'
            ],
            limits: {
                timeout: '15 seconds',
                max_results: 'Unlimited'
            }
        });
    });
};
