/* eslint-disable no-console */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../db';

// Removed top-level genAI to prevent import-time crash
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface LiveSessionConfig {
    hostId: string;
    visitorId: string;
    username: string;
    onAudioResponse: (audioData: Buffer) => void;
    onTextResponse: (text: string) => void;
    onError: (error: Error) => void;
}

/**
 * Gemini Real-Time Voice Session Handler
 * Uses Web Speech API transcription + Gemini 2.0 Flash + Natural TTS
 */
export class GeminiLiveSession {
    private model: any;
    private chat: any;
    private config: LiveSessionConfig;
    private isActive: boolean = false;

    constructor(config: LiveSessionConfig) {
        this.config = config;

        const apiKey = process.env.GEMINI_API_KEY || '';
        if (!apiKey) console.error("❌ MISSING GEMINI_API_KEY for Live Session");

        const genAI = new GoogleGenerativeAI(apiKey);

        this.model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash-exp',
            generationConfig: {
                temperature: 0.9,
                topP: 0.95,
                maxOutputTokens: 500, // Keep responses short for voice
            }
        });
    }

    async initialize() {
        try {
            console.log(`🎙️ Initializing voice session for ${this.config.username}`);

            // Fetch host user and profile for context
            const hostUser = await db.findUserById(this.config.hostId);
            const profile = await db.findProfileByUserId(this.config.hostId);

            // Build system instruction for natural voice conversation
            const systemContext = profile?.aiContext ||
                `You are ${hostUser?.firstName || this.config.username}. You're having a natural VOICE conversation.
                
                CRITICAL RULES:
                - Keep responses VERY SHORT (1-2 sentences maximum)
                - Speak naturally like a real human talking
                - Be warm, friendly, and conversational  
                - Handle multiple languages naturally (English, French, Arabic, etc.)
                - Understand if user makes mistakes or speaks imperfectly
                - Correct mistakes naturally without pointing them out
                - Show personality and emotion
                - Ask follow-up questions when natural`;

            // Fetch conversation history
            const rawHistory = await db.getMessagesForVisitor(this.config.hostId, this.config.visitorId);
            const recentHistory = rawHistory
                .slice(-10)
                .map(m => ({
                    role: m.senderId === 'ai' || !m.isUser ? 'model' : 'user',
                    parts: [{ text: m.content }]
                }));

            // Initialize chat
            this.chat = this.model.startChat({
                history: [
                    { role: 'user', parts: [{ text: systemContext }] },
                    { role: 'model', parts: [{ text: 'Ready for voice conversation!' }] },
                    ...recentHistory
                ]
            });

            this.isActive = true;
            console.log('✅ Voice session initialized successfully');

        } catch (error) {
            console.error('❌ Failed to initialize voice session:', error);
            this.config.onError(error as Error);
        }
    }

    /**
     * Process audio chunk from user (buffering for future implementation)
     */
    async processAudio(audioBuffer: Buffer) {
        // Currently not used - Web Speech API handles transcription client-side
        console.log(`🎤 Received audio chunk (${audioBuffer.length} bytes)`);
    }

    /**
     * Process text input from Web Speech API transcription
     */
    async processText(message: string) {
        if (!this.isActive) {
            console.warn('⚠️ Session not active, initializing...');
            await this.initialize();
            if (!this.isActive) {
                console.error('❌ Failed to initialize session');
                return;
            }
        }

        try {
            console.log(`💬 Processing: "${message}"`);

            // Save user message
            await db.createMessage({
                content: message,
                isUser: true,
                hostId: this.config.hostId,
                senderId: this.config.visitorId,
                visitorId: this.config.visitorId
            });

            // Send to Gemini with streaming
            const result = await this.chat.sendMessageStream(message);
            let fullResponse = '';

            for await (const chunk of result.stream) {
                const text = chunk.text();
                if (text) {
                    fullResponse += text;
                    this.config.onTextResponse(text);
                }
            }

            // Send complete response for TTS
            if (fullResponse.trim()) {
                this.config.onAudioResponse(Buffer.from(fullResponse));
            }

            // Save AI response
            await db.createMessage({
                content: fullResponse,
                isUser: false,
                hostId: this.config.hostId,
                senderId: 'ai',
                visitorId: this.config.visitorId
            });

            // Trigger learning
            this.runAdaptiveLearning(message);

        } catch (error) {
            console.error('❌ Error processing text:', error);
            this.config.onError(error as Error);
        }
    }

    /**
     * Adaptive learning - Extract facts and questions
     */
    private async runAdaptiveLearning(userMessage: string) {
        try {
            const hostUser = await db.findUserById(this.config.hostId);
            const profile = await db.findProfileByUserId(this.config.hostId);
            if (!hostUser || !profile) return;

            const apiKey = process.env.GEMINI_API_KEY || '';
            const genAI = new GoogleGenerativeAI(apiKey);
            const learningModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

            const learningPrompt = `
                Analyze: "${userMessage}"
                
                Extract any facts about ${hostUser.firstName} (the Host).
                Convert to 1st person. Output ONLY the fact or "NO".
            `;

            const result = await learningModel.generateContent(learningPrompt);
            const fact = result.response.text().trim().replace(/^(YES|FACT):?\s*/i, "");

            if (fact && fact !== "NO") {
                console.log(`💡 LEARNED: "${fact}"`);
                await db.createMemory({
                    profileId: profile.id,
                    type: 'LEARNED_FROM_GUEST',
                    prompt: 'Learned from voice',
                    content: fact
                });
                await db.refreshAiContext(profile.id);
            }
        } catch (err) {
            console.error("⚠️ Learning failed:", err);
        }
    }

    /**
     * End session
     */
    async end() {
        console.log('👋 Ending voice session');
        this.isActive = false;
        this.chat = null;
    }
}
