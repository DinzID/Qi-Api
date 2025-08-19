const axios = require('axios');
const cheerio = require('cheerio');
const moment = require('moment-timezone');

module.exports = function(app) {
    // Fungsi scrape info tourney (tambahan baru)
    async function infoTourney() {
        try {
            const url = 'https://infotourney.com/tournament/mobile-legends';
            const { data } = await axios.get(url);
            const $ = cheerio.load(data);
            const tournaments = [];

            $('.items-row .item').each((_, element) => {
                const item = $(element);

                const title = item.find('h2[itemprop="name"] a').text().trim();
                const link = item.find('h2[itemprop="name"] a').attr('href');
                const image = item.find('p img').attr('src');
                let datePublished = item.find('time[itemprop="datePublished"]').attr('datetime');

                if (datePublished) {
                    datePublished = moment(datePublished).tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm');
                }

                const descriptionHtml = item.find('p[style="text-align: center;"]').html() || "";
                const [rawDescription, rawInfo] = descriptionHtml.split('<br>').map(text => text.trim());

                const description = rawDescription ? rawDescription.replace(/&nbsp;/g, ' ') : "";
                const info = rawInfo ? rawInfo.replace(/&nbsp;/g, ' ') : "";

                const tags = [];
                item.find('.tags a').each((_, tagElement) => {
                    tags.push($(tagElement).text().trim());
                });

                tournaments.push({
                    title,
                    imageUrl: new URL(image, url).href,
                    datePublished,
                    description,
                    info,
                    tags,
                    url: new URL(link, url).href
                });
            });

            return tournaments;
        } catch (error) {
            throw new Error(error.message);
        }
    }

    // Endpoint baru khusus untuk tournament
    app.get('/api/tournaments/ml', async (req, res) => {
        try {
            const tournaments = await infoTourney();
            res.status(200).json({
                status: true,
                result: tournaments
            });
        } catch (error) {
            res.status(500).json({ 
                status: false, 
                error: error.message 
            });
        }
    });
};
