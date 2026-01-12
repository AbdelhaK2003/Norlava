/* eslint-disable no-console */
import { GoogleGenerativeAI } from '@google/generative-ai';
import WebSocket from 'ws';
import { db } from '../db';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface LiveSessionConfig {
    hostId: string;
    visitorId: string;
    username: string;
    onAudioResponse: (audioData: Buffer) => void;
    onTextResponse: (text: string) => void;
    onError: (error: Error) => void;
}

/**
 * Gemini 2.0 Flash Multimodal Live API Handler
 * Real voice-to-voice conversation (not TTS)
 */
export class GeminiLiveSession {
    private ws: WebSocket | null = null;
    private config: LiveSessionConfig;
    private isActive: boolean = false;
    private currentResponseText: string = '';
    private apiKey: string;

    constructor(config: LiveSessionConfig) {
        this.config = config;
        this.apiKey = process.env.GEMINI_API_KEY || '';
    }

    async initialize() {
        try {
            console.log(`🎙️ Initializing Gemini Live API for ${this.config.username}`);
            
            // Fetch host user and profile for context
            const hostUser = await db.findUserById(this.config.hostId);
            const profile = await db.findProfileByUserId(this.config.hostId);
            
            // Build system instruction for natural voice conversation
            const systemInstruction = profile?.aiContext || 
                `You are ${hostUser?.firstName || this.config.username}. You're having a natural voice conversation.
                
                IMPORTANT:
                - Speak naturally like a real human
                - Keep responses SHORT (1-2 sentences max)
                - Be conversational and warm
                - Handle multiple languages naturally (English, French, Arabic, etc.)
                - Understand context, tone, and emotion from voice
                - Don't mention that you're AI
                - Be yourself - show personality!`;

            // Connect to Gemini Multimodal Live API via WebSocket
            const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${this.apiKey}`;
            
            this.ws = new WebSocket(wsUrl);

            this.ws.on('open', () => {
                console.log('✅ Connected to Gemini Live API');
                
                // Send setup message
                this.ws?.send(JSON.stringify({
                    setup: {
                        model: 'models/gemini-2.0-flash-exp',
                        generation_config: {
                            response_modalities: ['AUDIO', 'TEXT'],
                            speech_config: {
                                voice_config: {
                                    prebuilt_voice_config: {
                                        voice_name: 'Aoede' // Natural voice
                                    }
                                }
                            }
                        },
                        system_instruction: {
                            parts: [{ text: systemInstruction }]
                        }
                    }
                }));
                
                this.isActive = true;
            });

            this.ws.on('message', (data: Buffer) => {
                try {
                    const response = JSON.parse(data.toString());
                    
                    // Handle server response with audio and text
                    if (response.serverContent) {
                        const parts = response.serverContent.modelTurn?.parts || [];
                        
                        for (const part of parts) {
                            // Text response
                            if (part.text) {
                                this.currentResponseText += part.text;
                                this.config.onTextResponse(part.text);
                            }
                            
                            // Audio response (real AI voice, not TTS!)
                            if (part.inlineData && part.inlineData.mimeType === 'audio/pcm') {
                                const audioBuffer = Buffer.from(part.inlineData.data, 'base64');
                                this.config.onAudioResponse(audioBuffer);
                            }
                        }
                        
                        // Save complete response to database
                        if (response.serverContent.turnComplete && this.currentResponseText) {
                            this.saveResponse(this.currentResponseText);
                            this.currentResponseText = '';
                        }
                    }
                    
                    // Handle setup completion
                    if (response.setupComplete) {
                        console.log('✅ Gemini Live setup complete');
                    }
                    
                } catch (error) {
                    console.error('❌ Error parsing Gemini response:', error);
                }
            });

            this.ws.on('error', (error) => {
                console.error('❌ WebSocket error:', error);
                this.config.onError(error);
            });

            this.ws.on('close', () => {
                console.log('👋 Gemini Live connection closed');
                this.isActive = false;
            });

        } catch (error) {
            console.error('❌ Failed to initialize Gemini Live:', error);
            this.config.onError(error as Error);
        }
    }

    /**
     * Send real audio to Gemini (processes voice directly!)
     */
    async processAudio(audioBuffer: Buffer) {
        if (!this.isActive || !this.ws) {
            console.warn('⚠️ Session not active');
            return;
        }

        try {
            // Send audio to Gemini Live API
            this.ws.send(JSON.stringify({
                clientContent: {
                    turns: [{
                        role: 'user',
                        parts: [{
                            inlineData: {
                                mimeType: 'audio/pcm',
                                data: audioBuffer.toString('base64')
                            }
                        }]
                    }],
                    turnComplete: true
                }
            }));
        } catch (error) {
            console.error('❌ Error sending audio:', error);
            this.config.onError(error as Error);
        }
    }

    /**
     * Process text input (fallback)
     */
    async processText(message: string) {
        if (!this.isActive || !this.ws) {
            console.warn('⚠️ Session not active');
            return;
        }

        try {
            // Save user message
            await db.createMessage({
                content: message,
                isUser: true,
                hostId: this.config.hostId,
                senderId: this.config.visitorId,
                visitorId: this.config.visitorId
            });

            // Send text to Gemini
            this.ws.send(JSON.stringify({
                clientContent: {
                    turns: [{
                        role: 'user',
                        parts: [{ text: message }]
                    }],
                    turnComplete: true
                }
            }));

        } catch (error) {
            console.error('❌ Error processing text:', error);
            this.config.onError(error as Error);
        }
    }

    /**
     * Save AI response to database
     */
    private async saveResponse(text: string) {
        try {
            await db.createMessage({
                content: text,
                isUser: false,
                hostId: this.config.hostId,
                senderId: 'ai',
                visitorId: this.config.visitorId
            });

            // Run adaptive learning in background
            this.runAdaptiveLearning(text);
        } catch (error) {
            console.error('❌ Error saving response:', error);
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
        console.log('👋 Ending Gemini Live session');
        this.isActive = false;
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}
