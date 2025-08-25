const fetch = require('node-fetch');

module.exports = function(app) {
    // Helper function untuk delay
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Fungsi utama spam NGL
    async function spamngl(link, pesan, jumlah) {
        if (!link.startsWith('https://ngl.link/')) throw new Error('Link harus berupa https://ngl.link/');
        if (!pesan) throw new Error('Pesan tidak boleh kosong');
        if (isNaN(jumlah) || jumlah < 1) throw new Error('Jumlah harus angka minimal 1');

        const username = link.split('https://ngl.link/')[1];
        if (!username) throw new Error('Username tidak ditemukan dari link');

        const results = {
            success: 0,
            failed: 0,
            attempts: jumlah
        };

        for (let i = 0; i < jumlah; i++) {
            try {
                const response = await fetch('https://ngl.link/api/submit', {
                    method: 'POST',
                    headers: {
                        'accept': '*/*',
                        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    },
                    body: `username=${username}&question=${encodeURIComponent(pesan)}&deviceId=${i + 1}`
                });

                if (response.ok) {
                    results.success++;
                } else {
                    results.failed++;
                    console.error(`Gagal kirim ${i + 1}:`, response.status);
                }

                await delay(1500); // Delay 1.5 detik antara setiap request

            } catch (err) {
                results.failed++;
                console.error('Gagal kirim:', err.message);
            }
        }

        return {
            username: username,
            message: pesan,
            total_attempts: jumlah,
            success: results.success,
            failed: results.failed,
            success_rate: `${((results.success / jumlah) * 100).toFixed(1)}%`,
            final_message: `Selesai mengirim ${results.success} pesan ke ${username}`
        };
    }

    // Endpoint: Spam NGL
    app.post('/tools/ngl/spam', async (req, res) => {
        try {
            const { link, message, count } = req.body;

            // Validasi parameter
            if (!link) {
                return res.status(400).json({
                    status: 400,
                    error: 'Parameter link diperlukan',
                    example: {
                        "link": "https://ngl.link/username",
                        "message": "Hai guys!",
                        "count": 5
                    }
                });
            }

            if (!message) {
                return res.status(400).json({
                    status: 400,
                    error: 'Parameter message diperlukan'
                });
            }

            if (!count || count < 1 || count > 5000000000) {
                return res.status(400).json({
                    status: 400,
                    error: 'Parameter count diperlukan (1-50)'
                });
            }

            console.log(`📤 Spamming NGL: ${link}, ${count} messages`);

            const result = await spamngl(link, message, count);

            res.json({
                status: 200,
                creator: "DinzID",
                result: result
            });

        } catch (error) {
            console.error('NGL Spam Error:', error.message);
            
            res.status(500).json({
                status: 500,
                creator: "DinzID",
                error: error.message
            });
        }
    });

    // Endpoint: Quick spam (GET method)
    app.get('/tools/ngl/quick', async (req, res) => {
        try {
            const { link, message, count } = req.query;

            if (!link || !message || !count) {
                return res.status(400).json({
                    status: 400,
                    error: 'Parameter link, message, dan count diperlukan',
                    example: '/tools/ngl/quick?link=https://ngl.link/username&message=Hai&count=3'
                });
            }

            const jumlah = parseInt(count);
            if (isNaN(jumlah) || jumlah < 1 || jumlah > 2000000) {
                return res.status(400).json({
                    status: 400,
                    error: 'Count harus angka antara 1-20'
                });
            }

            console.log(`⚡ Quick spam NGL: ${link}`);

            const result = await spamngl(link, message, jumlah);

            res.json({
                status: 200,
                creator: "DinzID",
                result: result
            });

        } catch (error) {
            res.status(500).json({
                status: 500,
                creator: "DinzID",
                error: error.message
            });
        }
    });

    // Endpoint: Check NGL link validity
    app.get('/tools/ngl/check', async (req, res) => {
        try {
            const { link } = req.query;

            if (!link) {
                return res.status(400).json({
                    status: 400,
                    error: 'Parameter link diperlukan'
                });
            }

            if (!link.startsWith('https://ngl.link/')) {
                return res.json({
                    status: 400,
                    valid: false,
                    error: 'Format link tidak valid'
                });
            }

            const username = link.split('https://ngl.link/')[1];
            
            // Coba test request kecil untuk mengecek validitas
            try {
                const testResponse = await fetch('https://ngl.link/api/submit', {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
                    },
                    body: `username=${username}&question=test&deviceId=0`
                });

                res.json({
                    status: 200,
                    valid: testResponse.status !== 404,
                    username: username,
                    checked_at: new Date().toISOString()
                });

            } catch (error) {
                res.json({
                    status: 200,
                    valid: false,
                    username: username,
                    error: 'Link mungkin tidak valid'
                });
            }

        } catch (error) {
            res.status(500).json({
                status: 500,
                error: error.message
            });
        }
    });

    // Endpoint: Info NGL spam
    app.get('/tools/ngl/info', (req, res) => {
        res.json({
            status: 200,
            creator: "DinzID",
            service: "NGL Spam API",
            endpoints: {
                post_spam: "POST /tools/ngl/spam",
                get_quick: "GET /tools/ngl/quick",
                check: "GET /tools/ngl/check",
                info: "GET /tools/ngl/info"
            },
            parameters: {
                link: "https://ngl.link/username (required)",
                message: "Pesan yang akan dikirim (required)",
                count: "Jumlah pesan (1-50)"
            },
            limits: {
                max_count: 50000,
                delay: "1.5 detik per request",
                rate_limit: "Hindari spam berlebihan"
            },
            examples: {
                post: {
                    "link": "https://ngl.link/exampleuser",
                    "message": "Hai! Ini test message",
                    "count": 3
                },
                get: "/tools/ngl/quick?link=https://ngl.link/exampleuser&message=Hai&count=3"
            }
        });
    });
};
