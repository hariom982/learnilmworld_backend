const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const APP_ACCESS_KEY = process.env.HMS_APP_ACCESS_KEY;   // from 100ms dashboard
const APP_SECRET     = process.env.HMS_APP_SECRET;       // from 100ms dashboard

// --- Helper: generate a Management Token (for server-side API calls) ---
function generateManagementToken() {
    const payload = {
        access_key: APP_ACCESS_KEY,
        type: 'management',
        version: 2,
        iat: Math.floor(Date.now() / 1000),
        nbf: Math.floor(Date.now() / 1000),
    };
    return jwt.sign(payload, APP_SECRET, {
        algorithm: 'HS256',
        expiresIn: '24h',
        jwtid: uuidv4(),
    });
}

// --- Helper: generate an Auth Token (for client to join a room) ---
function generateAuthToken(roomId, userId, role) {
    const payload = {
        access_key: APP_ACCESS_KEY,
        room_id: roomId,
        user_id: userId,
        role: role,       // e.g. "trainer" or "student" — must match roles in HMS dashboard
        type: 'app',
        version: 2,
        iat: Math.floor(Date.now() / 1000),
        nbf: Math.floor(Date.now() / 1000),
    };
    return jwt.sign(payload, APP_SECRET, {
        algorithm: 'HS256',
        expiresIn: '1h',
        jwtid: uuidv4(),
    });
}

// POST /api/hms/create-room
// Called when a trainer starts a session — creates a room and returns its ID
router.post('/create-room', async (req, res) => {
    const { roomName } = req.body;
    if (!roomName) return res.status(400).json({ error: 'roomName required' });

    try {
        const mgmtToken = generateManagementToken();

        const response = await fetch('https://api.100ms.live/v2/rooms', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${mgmtToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: roomName,
                description: 'LearnIlm tutoring session',
                template_id: process.env.HMS_TEMPLATE_ID, // from 100ms dashboard
            }),
        });

        const data = await response.json();
        if (!response.ok) return res.status(response.status).json({ error: data });

        res.json({ roomId: data.id, roomName: data.name });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/hms/join-token
// Called by both trainer and student right before joining
// POST /api/hms/join-token
router.post('/join-token', (req, res) => {
    const { roomId, userId, role: incomingRole } = req.body || {};  // safe destructuring

    console.log('Received body:', req.body);  // ← debug: see what client actually sent

    if (!roomId || !userId || !incomingRole) {
        return res.status(400).json({ 
            error: 'roomId, userId, and role are required',
            received: req.body 
        });
    }

    // Map to dashboard roles: host or guest
    let mappedRole = 'guest';
    if (incomingRole.toLowerCase() === 'trainer') {
        mappedRole = 'host';
    }

    console.log(`Mapping role: ${incomingRole} → ${mappedRole}`);

    try {
        const token = generateAuthToken(roomId, userId, mappedRole);
        
        console.log('Generated auth token for:', { 
            original: incomingRole, 
            mapped: mappedRole,
            roomId 
        });

        res.json({ token });
    } catch (err) {
        console.error('Token generation failed:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;