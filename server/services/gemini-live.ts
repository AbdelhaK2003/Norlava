/* eslint-disable no-console */
import { GoogleGenerativeAI } from '@google/generative-ai';
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
 * Gemini 2.0 Flash Live API Handler
 * Supports real-time bidirectional voice conversation
 */
export class GeminiLiveSession {
    private model: any;
    private chat: any;
    private config: LiveSessionConfig;
    private conversationHistory: Array<{ role: string; content: string }> = [];
    private isActive: boolean = false;

    constructor(config: LiveSessionConfig) {
        this.config = config;
        this.model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash-exp",
            generationConfig: {
                temperature: 0.9,
                topP: 0.95,
                maxOutputTokens: 2048,
            }
        });
    }

    async initialize() {
        try {
            console.log(`🎙️ Initializing Gemini Live session for ${this.config.username}`);
            
            // Fetch host user and profile for context
            const hostUser = await db.findUserById(this.config.hostId);
            const profile = await db.findProfileByUserId(this.config.hostId);
            
            // Build AI context
            const systemContext = profile?.aiContext || 
                `You are ${hostUser?.firstName || this.config.username}, a helpful digital assistant. 
                You're having a real-time voice conversation. Keep responses natural, concise, and conversational.`;

            // Fetch conversation history (last 10 messages for context)
            const rawHistory = await db.getMessagesForVisitor(this.config.hostId, this.config.visitorId);
            const recentHistory = rawHistory
                .slice(-10)
                .map(m => ({
                    role: m.senderId === 'ai' || !m.isUser ? 'model' : 'user',
                    parts: [{ text: m.content }]
                }));

            // Initialize chat with history
            this.chat = this.model.startChat({
                history: [
                    { role: 'user', parts: [{ text: systemContext }] },
                    { role: 'model', parts: [{ text: 'Understood. I am ready for voice conversation.' }] },
                    ...recentHistory
                ]
            });

            this.isActive = true;
            console.log('✅ Gemini Live session initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Gemini Live:', error);
            this.config.onError(error as Error);
        }
    }

    /**
     * Process incoming audio from user (PCM16 format expected)
     * Note: Currently not supported - use processText with Web Speech API transcription instead
     */
    async processAudio(audioBuffer: Buffer) {
        console.warn('⚠️ Raw audio processing not supported. Use Web Speech API for transcription.');
        // Audio processing via Gemini API is not available in the current SDK
        // The frontend should use Web Speech API to transcribe audio to text,
        // then send via processText method
    }

    /**
     * Process text input (fallback or hybrid mode)
     */
    async processText(message: string) {
        if (!this.isActive) {
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

            const learningModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

            // Fact extraction prompt
            const learningPrompt = `
                Analyze the following user message sent to a digital avatar of ${hostUser.firstName}.
                Does the message contain a specific FACT about ${hostUser.firstName} (the Host) that the avatar should remember?
                
                Message: "${userMessage}"
                
                Rules:
                1. EXTRACT: Biographical facts, Personality traits, Life goals, Preferences, or "Vibe" descriptions.
                2. INCLUDE "SOFT" FACTS: e.g., "You are a chill person", "You like to live peacefully", "I love making new friends".
                3. HANDLE 2ND PERSON: If the message says "You are X", treat it as a potential fact about ${hostUser.firstName}.
                4. CONVERT TO 1ST PERSON: Output the fact as if ${hostUser.firstName} is saying it (e.g. "I am a chill girl who wants to live peacefully").
                5. IGNORE: Greetings, temporary states ("You look tired"), or compliments that aren't deep traits ("You are cute").
                6. IGNORE GUEST INFO: Do not learn facts about the visitor.
                
                Output ONLY the declarative fact statement. Do NOT include "YES" or "FACT:". 
                If NO fact is found, output exactly "NO".
            `;

            // Question extraction prompt
            const questionPrompt = `
                Analyze the following message from a visitor to ${hostUser.firstName}'s AI.
                Is the visitor asking a specific, meaningful question about ${hostUser.firstName}'s life, identity, or preferences that requires a permanent answer?
                
                Message: "${userMessage}"
                
                Rules:
                1. MUST be a question about the Host's biography, favorites, history, or opinions.
                2. IGNORE conversational questions like "How are you?", "What are you doing?", "Can you help me?".
                3. IGNORE context-dependent questions like "Do you remember?", "What did I say?", "Why?".
                4. IGNORE vague questions. It must be specific enough that the Host could write a permanent Q&A answer for it.
                5. Examples of YES: "Where did you go to college?", "What is your favorite book?", "How did you start your company?".
                6. Examples of NO: "Do you remember me?", "Can I ask a question?", "What is this?".
                
                If YES, output ONLY the question text. Do NOT include "YES" or any other prefix.
                If NO, output exactly "NO".
            `;

            const [factResult, questionResult] = await Promise.all([
                learningModel.generateContent(learningPrompt),
                learningModel.generateContent(questionPrompt)
            ]);

            const fact = factResult.response.text().trim().replace(/^(YES|FACT):?\s*/i, "");
            const question = questionResult.response.text().trim().replace(/^(YES|QUESTION):?\s*/i, "");

            if (fact && fact !== "NO") {
                console.log(`💡 LEARNED NEW FACT: "${fact}"`);
                await db.createMemory({
                    profileId: profile.id,
                    type: 'LEARNED_FROM_GUEST',
                    prompt: 'Learned from voice conversation',
                    content: fact
                });
                await db.refreshAiContext(profile.id);
            }

            if (question && question !== "NO") {
                console.log(`❓ VISITOR ASKED: "${question}"`);
                await db.createMemory({
                    profileId: profile.id,
                    type: 'GUEST_QUESTION',
                    prompt: question,
                    content: ""
                });
            }
        } catch (err) {
            console.error("⚠️ Adaptive Learning failed:", err);
        }
    }

    /**
     * Interrupt current response (for natural conversation flow)
     */
    async interrupt() {
        console.log('⏸️ Interrupting current response');
        // Reset streaming state
        this.isActive = false;
        await new Promise(resolve => setTimeout(resolve, 100));
        this.isActive = true;
    }

    /**
     * End session and cleanup
     */
    async end() {
        console.log('👋 Ending Gemini Live session');
        this.isActive = false;
        this.chat = null;
    }
}
