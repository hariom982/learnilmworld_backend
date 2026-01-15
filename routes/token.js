// Import official generator
const express = require('express');
const router = express.Router();
const { generateToken04 } = require('../zego_server/zego_server_assistent'); // Adjust path if needed
// Read from .env
const appID = Number(process.env.APP_ID);
const serverSecret = process.env.SERVER_SECRET;

router.post('/generate-token', (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ error: 'userId required' });
    }

    const effectiveTimeInSeconds = 3600;
    const payload = ''; // Empty for basic calls

    try {
        const token = generateToken04(
            appID,
            userId,
            serverSecret,
            effectiveTimeInSeconds,
            payload
        );
        console.log(token);
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Token generation failed' });
    }
});
module.exports = router;