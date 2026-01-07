
import express from 'express';
import multer from 'multer';
import FormData from 'form-data';
import axios from 'axios';
import fs from 'fs';
import { db } from '../db';
import { authenticateToken } from '../middleware/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

// Configure Multer for memory storage (files are small, ~1MB for 1 min audio)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

router.post('/clone-and-analyze', authenticateToken, upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: "No audio file provided" });
            return; // Stop execution
        }

        const userId = (req as any).user.userId;
        const user = await db.findUserById(userId);

        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        console.log(`🎙️ Processing Voice Sample for ${user.username}...`);

        // --- STEP 1: ELEVENLABS VOICE CLONING ---
        let voiceId = null;
        try {
            console.log("🔹 Sending to ElevenLabs...");
            const form = new FormData();
            form.append('name', `Clone-${user.username}`);
            form.append('files', req.file.buffer, { filename: 'sample.mp3', contentType: req.file.mimetype });
            form.append('description', `Voice clone for ${user.firstName}`);
            // Optional: Labels
            // form.append('labels', JSON.stringify({ "accent": "American" }));

            const elevenLabsResponse = await axios.post('https://api.elevenlabs.io/v1/voices/add', form, {
                headers: {
                    ...form.getHeaders(),
                    'xi-api-key': process.env.ELEVENLABS_API_KEY
                }
            });

            voiceId = elevenLabsResponse.data.voice_id;
            console.log(`✅ Voice Cloned! ID: ${voiceId}`);
        } catch (elevenErr: any) {
            console.error("❌ ElevenLabs Error:", elevenErr.response?.data || elevenErr.message);
            // We continue even if cloning fails, to at least analyze the profile
        }

        // --- STEP 2: GEMINI ANALYSIS (TRANSCRIPTION + PROFILE EXTRACTION) ---
        console.log("🔹 Sending to Gemini for Analysis...");

        // Convert buffer to base64 for Gemini
        const audioBase64 = req.file.buffer.toString('base64');

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            Listen to this user's introduction.
            1. Transcribe what they said.
            2. Extract key profile information:
               - Recommended "Bio" (1st person, engaging)
               - List of "Interests" (array of strings)
               - "Personality" traits (array of strings)
               - "Fun Facts" (array of strings, inferred or explicitly stated)
            
            Return JSON ONLY:
            {
                "transcription": "...",
                "bio": "...",
                "interests": ["..."],
                "personality": ["..."],
                "funFacts": ["..."]
            }
        `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: req.file.mimetype.includes('wav') ? 'audio/wav' : 'audio/mp3',
                    data: audioBase64
                }
            }
        ]);

        const responseText = result.response.text();
        // Cleanup JSON (remove markdown code blocks if any)
        const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const analysis = JSON.parse(jsonStr);

        console.log("✅ Analysis Complete:", analysis.bio.substring(0, 50) + "...");

        // --- STEP 3: SAVE TO DATABASE ---

        // Update Profile (Create if not exists)
        let profile = await db.findProfileByUserId(userId);

        // Prepare AI Context
        const aiContext = `You are ${user.firstName}. Bio: ${analysis.bio}. Interests: ${analysis.interests.join(', ')}. Personality: ${analysis.personality.join(', ')}.`;

        const profileData = {
            interests: JSON.stringify(analysis.interests),
            personality: JSON.stringify(analysis.personality),
            funFacts: JSON.stringify(analysis.funFacts),
            aiContext: aiContext,
            voiceId: voiceId // Save the cloned voice ID
        };

        if (profile) {
            await db.updateProfile(userId, profileData);
        } else {
            await db.createProfile({
                userId,
                ...profileData,
                voiceId: voiceId || undefined
            });
        }

        res.json({
            success: true,
            voiceId,
            analysis
        });

    } catch (error: any) {
        console.error("❌ Voice Onboarding Error:", error);
        res.status(500).json({ error: error.message || "Failed to process voice" });
    }
});

router.post('/speak', authenticateToken, async (req, res) => {
    try {
        const { text, voiceId } = req.body;

        if (!text || !voiceId) {
            res.status(400).json({ error: "Missing text or voiceId" });
            return;
        }

        const response = await axios.post(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
            {
                text,
                model_id: "eleven_monolingual_v1",
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75
                }
            },
            {
                headers: {
                    'xi-api-key': process.env.ELEVENLABS_API_KEY,
                    'Content-Type': 'application/json'
                },
                responseType: 'arraybuffer' // Important for audio
            }
        );

        res.set('Content-Type', 'audio/mpeg');
        res.send(response.data);

    } catch (error: any) {
        console.error("❌ TTS Error:", error?.response?.data || error.message);
        res.status(500).json({ error: "TTS Failed" });
    }
});

export default router;
