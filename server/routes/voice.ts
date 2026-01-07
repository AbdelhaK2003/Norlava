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

        // Debug: Check if key is loaded correctly
        const keyStatus = ELEVENLABS_API_KEY ? `Present (Starts with ${ELEVENLABS_API_KEY.substring(0, 4)}...)` : 'Missing';
        console.log(`🎙️ Generating Voice for: "${text.substring(0, 20)}..." | Key Status: ${keyStatus}`);

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
                'xi-api-key': ELEVENLABS_API_KEY.trim(), // Trim to handle accidental spaces
                'Content-Type': 'application/json',
            },
            responseType: 'stream'
        });

        // Set headers for audio streaming AND CORS
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.setHeader('Access-Control-Allow-Credentials', 'true');

        // Pipe the audio stream directly to the client
        response.data.pipe(res);

        response.data.on('error', (err: any) => {
            console.error("Stream Error:", err);
            res.end();
        });

    } catch (error: any) {
        let errorDetails = error.message;

        // If it's an Axios error with a response
        if (error.response) {
            // If the response data is a stream (Unzip/IncomingMessage), read it
            if (error.response.data && typeof error.response.data.on === 'function') {
                try {
                    const chunks: Buffer[] = [];
                    // Using async iterator for the stream
                    for await (const chunk of error.response.data) {
                        chunks.push(Buffer.from(chunk));
                    }
                    const body = Buffer.concat(chunks).toString('utf8');
                    console.error('🔥 ElevenLabs API Error Body:', body);
                    errorDetails = body;
                } catch (readErr) {
                    console.error('Failed to read error stream:', readErr);
                }
            } else {
                // Not a stream or already read
                console.error('🔥 ElevenLabs Error Data:', error.response.data);
                errorDetails = JSON.stringify(error.response.data);
            }
        } else {
            console.error('🔥 Unknown Voice Error:', error.message);
        }

        const status = error.response?.status || 500;

        res.status(status).json({
            error: 'Failed to generate speech',
            details: errorDetails
        });
    }
});

export default router;
