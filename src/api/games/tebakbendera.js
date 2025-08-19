const axios = require('axios');
const express = require('express');

module.exports = function(app) {
    // URL Gist yang Anda berikan
    const FLAG_DATA_URL = "https://gist.githubusercontent.com/DinzID/a9cc8367fab1f4c9dd0ab0c405fb6b81/raw/4e04f3fd57be8a8fb905a243e23edf3c525236dd/tebakbendera.json";
    
    // Cache data bendera
    let flagData = [];
    
    // Fungsi untuk memuat data dari Gist
    async function loadFlagData() {
        try {
            const response = await axios.get(FLAG_DATA_URL);
            flagData = response.data;
            console.log('Data bendera berhasil dimuat dari Gist');
        } catch (error) {
            console.error('Gagal memuat data bendera:', error.message);
            throw error; // Tidak ada fallback, langsung throw error
        }
    }
    
    // Inisialisasi: Muat data saat API start
    loadFlagData();
    
    // Session storage
    const gameSessions = {};
    
    // Endpoint: Mulai permainan baru
    app.get('/games/tebakbendera/start', async (req, res) => {
        try {
            if (flagData.length === 0) await loadFlagData(); // Pastikan data sudah terload
            
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
            
            res.json({
                status: true,
                sessionId,
                flagImage: correctAnswer.img,
                options: options.map(opt => opt.name)
            });
            
        } catch (error) {
            res.status(500).json({
                status: false,
                error: "Gagal memuat data bendera. Silakan coba lagi nanti."
            });
        }
    });
    
    // Endpoint: Submit jawaban
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
            attempts: session.attempts
        });
    });
    
    // Endpoint: Dapatkan semua data bendera (opsional)
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
        res.json({
            status: true,
            isCorrect,
            correctAnswer: session.correctAnswer,
            attempts: session.attempts
        });
    });

    // Endpoint to get all flags (for reference)
    app.get('/tebakbendera/all', (req, res) => {
        res.json({
            status: true,
            count: flagData.length,
            flags: flagData
        });
    });

    // Endpoint information
    app.get('/tebakbendera', (req, res) => {
        res.json({
            name: "Tebak Bendera",
            desc: "Game tebak-tebakan bendera negara",
            endpoints: {
                start: "/tebakbendera/start",
                answer: "/tebakbendera/answer?sessionId=ID&answer=JAWABAN",
                allFlags: "/tebakbendera/all"
            },
            status: "ready"
        });
    });
};
