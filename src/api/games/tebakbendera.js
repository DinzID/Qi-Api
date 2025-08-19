const axios = require('axios');
const express = require('express');

module.exports = function(app) {
    const FLAG_DATA_URL = "https://gist.githubusercontent.com/DinzID/a9cc8367fab1f4c9dd0ab0c405fb6b81/raw/4e04f3fd57be8a8fb905a243e23edf3c525236dd/tebakbendera.json";
    
    let flagData = [];
    const gameSessions = {};
    const debugMode = true; // Set to false in production

    async function loadFlagData() {
        try {
            const response = await axios.get(FLAG_DATA_URL);
            flagData = response.data;
            console.log('Data bendera berhasil dimuat dari Gist');
        } catch (error) {
            console.error('Gagal memuat data bendera:', error.message);
            throw error;
        }
    }

    loadFlagData();

    app.get('/games/tebakbendera/start', async (req, res) => {
        try {
            if (flagData.length === 0) await loadFlagData();
            
            const options = [...flagData]
                .sort(() => Math.random() - 0.5)
                .slice(0, 4);
            
            const correctAnswer = options[Math.floor(Math.random() * 4)];
            const sessionId = Date.now().toString();
            
            gameSessions[sessionId] = {
                correctAnswer: correctAnswer.name,
                flagImage: correctAnswer.img,
                attempts: 0
            };
            
            const response = {
                status: true,
                sessionId,
                flagImage: correctAnswer.img,
                options: options.map(opt => opt.name)
            };

            // Tambahkan jawaban benar di mode debug
            if (debugMode) {
                response.debug = {
                    correctAnswer: correctAnswer.name,
                    flagCode: correctAnswer.flag
                };
            }
            
            res.json(response);
            
        } catch (error) {
            res.status(500).json({
                status: false,
                error: "Gagal memuat data bendera. Silakan coba lagi nanti."
            });
        }
    });

    app.get('/games/tebakbendera/answer', (req, res) => {
        const { sessionId, answer } = req.query;
        
        if (!sessionId || !answer) {
            return res.status(400).json({
                status: false,
                error: "Parameter sessionId dan answer diperlukan!"
            });
        }
        
        const session = gameSessions[sessionId];
        if (!session) {
            return res.status(404).json({
                status: false,
                error: "Session tidak valid!"
            });
        }
        
        session.attempts++;
        const isCorrect = answer.trim().toLowerCase() === session.correctAnswer.toLowerCase();
        
        res.json({
            status: true,
            isCorrect,
            correctAnswer: session.correctAnswer,
            attempts: session.attempts,
            flagImage: session.flagImage // Tambahkan gambar bendera di response
        });
    });

    app.get('/games/tebakbendera/all', async (req, res) => {
        try {
            if (flagData.length === 0) await loadFlagData();
            res.json({
                status: true,
                count: flagData.length,
                flags: flagData
            });
        } catch (error) {
            res.status(500).json({
                status: false,
                error: "Gagal memuat data bendera."
            });
        }
    });
};
