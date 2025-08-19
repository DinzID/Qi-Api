const axios = require('axios');
const express = require('express');

module.exports = function(app) {
    // Flag data (can be fetched from the URL or used directly)
    const flagData = [
        { "flag": "AF", "img": "https://flagcdn.com/w320/af.png", "name": "Afghanistan" },
        { "flag": "ZA", "img": "https://flagcdn.com/w320/za.png", "name": "Afrika Selatan" },
        // ... (all other flag data from the JSON)
        { "flag": "ZW", "img": "https://flagcdn.com/w320/zw.png", "name": "Zimbabwe" }
    ];

    // In-memory storage for user sessions
    const userSessions = {};

    // Helper function to get random flags
    function getRandomFlags(count = 4) {
        const shuffled = [...flagData].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    // Endpoint to start a new game
    app.get('/tebakbendera/start', (req, res) => {
        const sessionId = Date.now().toString(); // Simple session ID
        const options = getRandomFlags(4);
        const correctAnswer = options[Math.floor(Math.random() * 4)];
        
        userSessions[sessionId] = {
            correctAnswer: correctAnswer.name,
            options: options.map(opt => opt.name),
            attempts: 0,
            answered: false
        };

        res.json({
            status: true,
            sessionId,
            question: {
                flagImage: correctAnswer.img,
                options: options.map(opt => opt.name)
            }
        });
    });

    // Endpoint to submit an answer
    app.get('/tebakbendera/answer', (req, res) => {
        const { sessionId, answer } = req.query;
        
        if (!sessionId || !answer) {
            return res.status(400).json({ 
                status: false, 
                error: 'Session ID and answer are required' 
            });
        }

        const session = userSessions[sessionId];
        if (!session) {
            return res.status(404).json({ 
                status: false, 
                error: 'Session not found' 
            });
        }

        session.attempts++;
        const isCorrect = answer.toLowerCase() === session.correctAnswer.toLowerCase();
        session.answered = isCorrect;

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
