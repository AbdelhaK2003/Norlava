import { Router } from 'express';
import axios from 'axios';

const router = Router();
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
// "Rachel" voice ID - American, Soft, Professional. Good default.
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

router.post('/speak', async (req, res) => {
    try {
        const { text, voiceId } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        if (!ELEVENLABS_API_KEY) {
            console.error("❌ ElevenLabs API Key missing!");
            return res.status(503).json({
                error: 'Voice service not configured',
                details: 'ELEVENLABS_API_KEY is missing on the server.'
            });
        }

        console.log(`🎙️ Generating Voice for: "${text.substring(0, 20)}..."`);

        const response = await axios({
            method: 'POST',
            url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId || DEFAULT_VOICE_ID}`,
            data: {
                text: text,
                model_id: "eleven_monolingual_v1", // Low latency model
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75
                }
            },
            headers: {
                'Accept': 'audio/mpeg',
                'xi-api-key': ELEVENLABS_API_KEY,
                'Content-Type': 'application/json',
            },
            responseType: 'stream'
        });

        // Set headers for audio streaming
        res.setHeader('Content-Type', 'audio/mpeg');

        // Pipe the audio stream directly to the client
        response.data.pipe(res);

    } catch (error: any) {
        console.error('🔥 ElevenLabs Error:', error.response?.data || error.message);

        // Pass the actual error detail to the client for debugging
        const status = error.response?.status || 500;
        const detail = error.response?.data ? JSON.stringify(error.response.data) : error.message;

        res.status(status).json({
            error: 'Failed to generate speech',
            details: detail
        });
    }
});

export default router;
