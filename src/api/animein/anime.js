const axios = require('axios');

module.exports = function(app) {
    // Konfigurasi animein
    const animein = {
        api: {
            base: 'https://xyz-api.animein.net',
            image: 'https://api.animein.net',
            endpoint: {
                home: (include) => `/3/2/home/${include}`,
                popular: '/3/2/home/popular',
                explore: '/3/2/explore/data',
                search: '/3/2/explore/movie',
                fyp: '/data/home/fyp',
                schedule: '/3/2/schedule/data',
                details: (id) => `/3/2/movie/detail/${id}`,
                episodeList: (id) => `/3/2/movie/episode/${id}`,
                streams: (id) => `/3/2/episode/streamnew/${id}`
            }
        },
        headers: {
            'user-agent': 'NB Android/1.0.0',
            'connection': 'Keep-Alive',
            'accept-encoding': 'gzip'
        },
        
        imgex(item) {
            if (!item || typeof item !== 'object') return item;
            const clone = { ...item };
            const fields = ['image', 'image_poster', 'image_cover'];
            fields.forEach(field => {
                if (clone[field] && !clone[field].startsWith('http')) {
                    clone[field] = `${animein.api.image}${clone[field]}`;
                }
            });
            return clone;
        }
    };

    // Helper function untuk handle response
    function handleResponse(success, code, result) {
        return {
            success,
            code,
            result,
            timestamp: new Date().toISOString()
        };
    }

    // Endpoint: Home
    app.get('/animein/home', async (req, res) => {
        try {
            const { include, day, limit = 10, id_user = 0, key_client = 'null' } = req.query;

            // Validasi
            if (!include) {
                return res.status(400).json(handleResponse(false, 400, { 
                    error: 'Parameter include diperlukan' 
                }));
            }

            const isOpt = ['data', 'hot', 'new', 'popular', 'random'];
            if (!isOpt.includes(include.toLowerCase())) {
                return res.status(400).json(handleResponse(false, 400, { 
                    error: 'Include tidak valid. Pilih: data, hot, new, popular, random' 
                }));
            }

            if (include.toLowerCase() === 'data' && !day) {
                return res.status(400).json(handleResponse(false, 400, { 
                    error: 'Parameter day diperlukan untuk include=data' 
                }));
            }

            let url;
            const params = { limit: parseInt(limit), id_user, key_client };

            switch (include.toLowerCase()) {
                case 'data':
                    params.setup_fyp_flag = 'Y';
                    params.day = day.toUpperCase();
                    url = `${animein.api.base}${animein.api.endpoint.home('data')}`;
                    break;
                case 'hot':
                case 'new':
                case 'random':
                    url = `${animein.api.base}${animein.api.endpoint.home(include.toLowerCase())}`;
                    break;
                case 'popular':
                    url = `${animein.api.base}${animein.api.endpoint.popular}`;
                    break;
            }

            const { data } = await axios.get(url, { 
                headers: animein.headers, 
                params,
                timeout: 15000
            });

            let result;
            if (['popular', 'random'].includes(include.toLowerCase())) {
                result = { 
                    movie: (data.data?.movie ?? []).map(m => animein.imgex(m)) 
                };
            } else {
                result = Array.isArray(data.data?.movie) ? { 
                    ...data.data, 
                    movie: data.data.movie.map(m => animein.imgex(m)) 
                } : data.data ?? {};
            }

            res.json(handleResponse(true, 200, result));

        } catch (error) {
            console.error('Home Error:', error.message);
            res.status(500).json(handleResponse(false, 500, { 
                error: error.message 
            }));
        }
    });

    // Endpoint: Explore
    app.get('/animein/explore', async (req, res) => {
        try {
            const { limit = 10 } = req.query;

            const { data } = await axios.get(
                `${animein.api.base}${animein.api.endpoint.explore}`, 
                { 
                    headers: animein.headers, 
                    params: { limit: parseInt(limit) },
                    timeout: 15000
                }
            );

            const result = {
                genre: data.data?.genre ?? [],
                year: data.data?.year ?? [],
                trailer: (data.data?.trailer ?? []).map(t => animein.imgex(t))
            };

            res.json(handleResponse(true, 200, result));

        } catch (error) {
            console.error('Explore Error:', error.message);
            res.status(500).json(handleResponse(false, 500, { 
                error: error.message 
            }));
        }
    });

    // Endpoint: Search
    app.get('/animein/search', async (req, res) => {
        try {
            const { keyword, genre_in = '', sort = 'views', page = 0 } = req.query;

            if (!keyword) {
                return res.status(400).json(handleResponse(false, 400, { 
                    error: 'Parameter keyword diperlukan' 
                }));
            }

            const params = { keyword, genre_in, sort, page: parseInt(page) };
            const { data } = await axios.get(
                `${animein.api.base}${animein.api.endpoint.search}`,
                { 
                    headers: animein.headers, 
                    params,
                    timeout: 15000
                }
            );

            const result = {
                movie: (data.data?.movie ?? []).map(m => animein.imgex(m))
            };

            res.json(handleResponse(true, 200, result));

        } catch (error) {
            console.error('Search Error:', error.message);
            res.status(500).json(handleResponse(false, 500, { 
                error: error.message 
            }));
        }
    });

    // Endpoint: Schedule
    app.get('/animein/schedule', async (req, res) => {
        try {
            const { day } = req.query;
            const isDays = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];

            if (!day) {
                return res.status(400).json(handleResponse(false, 400, { 
                    error: 'Parameter day diperlukan' 
                }));
            }

            if (!isDays.includes(day.toUpperCase())) {
                return res.status(400).json(handleResponse(false, 400, { 
                    error: 'Day tidak valid. Pilih: ' + isDays.join(', ') 
                }));
            }

            const { data } = await axios.get(
                `${animein.api.base}${animein.api.endpoint.schedule}`,
                { 
                    headers: animein.headers, 
                    params: { day: day.toUpperCase() },
                    timeout: 15000
                }
            );

            const result = {
                movie: (data.data?.movie ?? []).map(m => animein.imgex(m))
            };

            res.json(handleResponse(true, 200, result));

        } catch (error) {
            console.error('Schedule Error:', error.message);
            res.status(500).json(handleResponse(false, 500, { 
                error: error.message 
            }));
        }
    });

    // Endpoint: Anime Info
    app.get('/animein/info', async (req, res) => {
        try {
            const { id, id_user = 0, key_client = 'null', page = 0, search = '' } = req.query;

            if (!id) {
                return res.status(400).json(handleResponse(false, 400, { 
                    error: 'Parameter id diperlukan' 
                }));
            }

            const animeId = id.toString().match(/\d+$/)?.[0] || id;

            // Get details
            const detailsResponse = await axios.get(
                `${animein.api.base}${animein.api.endpoint.details(animeId)}`,
                { 
                    headers: animein.headers, 
                    params: { id_user, key_client },
                    timeout: 15000
                }
            );

            const movie = animein.imgex(detailsResponse.data.data?.movie ?? {});
            const episode_first = animein.imgex(detailsResponse.data.data?.episode ?? {});
            const season = (detailsResponse.data.data?.season ?? []).map(m => animein.imgex(m));

            let episodes = [];
            if (movie.type === 'SERIES') {
                // Get episodes list
                const epsResponse = await axios.get(
                    `${animein.api.base}${animein.api.endpoint.episodeList(animeId)}`,
                    { 
                        headers: animein.headers, 
                        params: { id_user, key_client, page: parseInt(page), search },
                        timeout: 15000
                    }
                );
                episodes = (epsResponse.data?.data?.episode ?? []).map(e => animein.imgex(e));
            }

            const result = {
                type: movie.type || null,
                movie,
                episode_first,
                episodes,
                season
            };

            res.json(handleResponse(true, 200, result));

        } catch (error) {
            console.error('Info Error:', error.message);
            res.status(500).json(handleResponse(false, 500, { 
                error: error.message 
            }));
        }
    });

    // Endpoint: Streams
    app.get('/animein/streams', async (req, res) => {
        try {
            const { id } = req.query;

            if (!id) {
                return res.status(400).json(handleResponse(false, 400, { 
                    error: 'Parameter id diperlukan' 
                }));
            }

            const { data } = await axios.get(
                `${animein.api.base}${animein.api.endpoint.streams(id)}`,
                { 
                    headers: animein.headers,
                    timeout: 15000
                }
            );

            const result = {
                episode: animein.imgex(data.data?.episode ?? {}),
                episode_next: animein.imgex(data.data?.episode_next ?? null),
                server: (data.data?.server ?? []).map(s => animein.imgex(s))
            };

            res.json(handleResponse(true, 200, result));

        } catch (error) {
            console.error('Streams Error:', error.message);
            res.status(500).json(handleResponse(false, 500, { 
                error: error.message 
            }));
        }
    });

    // Endpoint: FYP (For You Page)
    app.get('/animein/fyp', async (req, res) => {
        try {
            const { favorite = -1, id_fyp = '', id_user = 0, key_client = 'null' } = req.query;

            const { data } = await axios.get(
                `${animein.api.base}${animein.api.endpoint.fyp}`,
                { 
                    headers: animein.headers, 
                    params: { favorite, id_fyp, id_user, key_client },
                    timeout: 15000
                }
            );

            const result = data.data ?? {};
            if (Array.isArray(result.movie)) {
                result.movie = result.movie.map(m => animein.imgex(m));
            }

            res.json(handleResponse(true, 200, result));

        } catch (error) {
            console.error('FYP Error:', error.message);
            res.status(500).json(handleResponse(false, 500, { 
                error: error.message 
            }));
        }
    });

    // Health Check
    app.get('/animein/health', async (req, res) => {
        try {
            // Test connection
            await axios.get(`${animein.api.base}${animein.api.endpoint.popular}`, {
                headers: animein.headers,
                timeout: 10000
            });

            res.json(handleResponse(true, 200, { 
                message: 'API is healthy',
                base_url: animein.api.base
            }));

        } catch (error) {
            res.json(handleResponse(false, 500, { 
                error: 'Health check failed',
                message: error.message 
            }));
        }
    });

    // Info Endpoint
    app.get('/animein', (req, res) => {
        res.json({
            status: true,
            service: 'AnimeIn API Wrapper',
            version: '1.0',
            endpoints: {
                home: '/animein/home?include=[data|hot|new|popular|random]&day=[hari]&limit=10',
                explore: '/animein/explore?limit=10',
                search: '/animein/search?keyword=[query]&genre_in=&sort=views&page=0',
                schedule: '/animein/schedule?day=[MINGGU|SENIN|...]',
                info: '/animein/info?id=[anime_id]',
                streams: '/animein/streams?id=[episode_id]',
                fyp: '/animein/fyp?favorite=-1&id_fyp=',
                health: '/animein/health'
            },
            parameters: {
                include: 'data, hot, new, popular, random',
                day: 'MINGGU, SENIN, SELASA, RABU, KAMIS, JUMAT, SABTU',
                sort: 'views (default)'
            }
        });
    });
};
