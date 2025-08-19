const axios = require('axios');
const express = require('express');

module.exports = function(app) {
    function formatNumber(integer) {
        let numb = parseInt(integer);
        return Number(numb).toLocaleString().replace(/,/g, '.');
    }

    function formatDate(n, locale = 'en') {
        let d = new Date(n * 1000); // Convert from seconds to milliseconds
        return d.toLocaleDateString(locale, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric'
        }).replace('1970', '');
    }

    // TikTok Downloader Endpoint
    app.get('/downloader/tiktok', async (req, res) => {
        try {
            const { url } = req.query;
            
            if (!url) {
                return res.status(400).json({
                    status: false,
                    error: 'URL parameter is required'
                });
            }

            const domain = 'https://www.tikwm.com/api/';
            const response = await axios.post(domain, {}, {
                headers: {
                    'Accept': 'application/json, text/javascript, */*; q=0.01',
                    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Origin': 'https://www.tikwm.com',
                    'Referer': 'https://www.tikwm.com/',
                    'Sec-Ch-Ua': '"Not)A;Brand";v="24", "Chromium";v="116"',
                    'Sec-Ch-Ua-Mobile': '?1',
                    'Sec-Ch-Ua-Platform': 'Android',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'same-origin',
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                params: {
                    url: url,
                    count: 12,
                    cursor: 0,
                    web: 1,
                    hd: 1
                }
            });

            const resData = response.data.data;
            let data = [];

            if (resData?.duration === 0) {
                // Handle photo posts
                resData.images.map(v => {
                    data.push({ 
                        type: 'photo', 
                        url: v 
                    });
                });
            } else {
                // Handle video posts
                data.push({
                    type: 'watermark',
                    url: 'https://www.tikwm.com' + (resData?.wmplay || "/undefined"),
                }, {
                    type: 'nowatermark',
                    url: 'https://www.tikwm.com' + (resData?.play || "/undefined"),
                }, {
                    type: 'nowatermark_hd',
                    url: 'https://www.tikwm.com' + (resData?.hdplay || "/undefined")
                });
            }

            const result = {
                status: true,
                title: resData.title,
                taken_at: formatDate(resData.create_time),
                region: resData.region,
                id: resData.id,
                durations: resData.duration,
                duration: resData.duration + ' Seconds',
                cover: 'https://www.tikwm.com' + resData.cover,
                size_wm: resData.wm_size,
                size_nowm: resData.size,
                size_nowm_hd: resData.hd_size,
                data: data,
                music_info: {
                    id: resData.music_info.id,
                    title: resData.music_info.title,
                    author: resData.music_info.author,
                    album: resData.music_info.album || null,
                    url: 'https://www.tikwm.com' + (resData.music || resData.music_info.play)
                },
                stats: {
                    views: formatNumber(resData.play_count),
                    likes: formatNumber(resData.digg_count),
                    comment: formatNumber(resData.comment_count),
                    share: formatNumber(resData.share_count),
                    download: formatNumber(resData.download_count)
                },
                author: {
                    id: resData.author.id,
                    fullname: resData.author.unique_id,
                    nickname: resData.author.nickname,
                    avatar: 'https://www.tikwm.com' + resData.author.avatar
                }
            };

            res.json(result);

        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({
                status: false,
                error: 'Failed to process TikTok URL',
                message: error.message
            });
        }
    });

    // API Documentation Endpoint
    app.get('/downloader/tiktok/docs', (req, res) => {
        res.json({
            name: "TikTok Downloader",
            desc: "Download TikTok videos without watermark",
            path: "/downloader/tiktok?url=[TIKTOK_URL]",
            status: "ready",
            params: {
                url: "TikTok video URL (required)"
            },
            example: {
                request: "/downloader/tiktok?url=https://www.tiktok.com/@username/video/123456789",
                response: {
                    status: true,
                    title: "Video title",
                    // ... (other fields from the actual response)
                }
            }
        });
    });
};
