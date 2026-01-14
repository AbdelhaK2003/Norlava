/* eslint-disable no-console */
import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import trainingRoutes from './routes/training';
import factsRoutes from './routes/facts';
import { db, prisma } from './db';
import { GeminiLiveSession } from './services/gemini-live';

// Initialize Google Gemini AI (SDK automatically uses appropriate API version)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Store active live voice sessions
const liveSessions = new Map<string, GeminiLiveSession>();

// Track session messages - resets on new connection
// Each session only uses messages from current page load
const sessionMessages = new Map<string, any[]>();

// Helper: Check if a similar question was already asked in this session
function hasSimilarQuestionBeenAsked(newMessage: string, sessionHistory: any[], threshold = 0.7): boolean {
    if (!sessionHistory || sessionHistory.length === 0) return false;

    const newWords = newMessage.toLowerCase().split(/\s+/).filter(w => w.length > 3);

    // Check recent messages (last 10)
    const recentMessages = sessionHistory.slice(-10);

    for (const msg of recentMessages) {
        if (msg.isUser) { // Check user's previous messages
            const existingWords = msg.content.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
            const commonWords = newWords.filter((w: string) => existingWords.includes(w));
            const similarity = commonWords.length / Math.max(newWords.length, existingWords.length);

            if (similarity >= threshold) {
                return true; // Similar question found
            }
        }
    }
    return false;
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production'
            ? [
                "https://norlava.com",
                "https://www.norlava.com",
                "https://norlava.vercel.app",
                "https://abdelhak-zvmu.norlava.com",
                process.env.FRONTEND_URL || "https://norlava.com"
            ]
            : ["http://localhost:5173", "http://localhost:8080"],
        methods: ["GET", "POST"],
        credentials: true
    }
});

const PORT = 3000;

console.log("🔍 Server Starting...");
console.log("📂 Current Working Directory:", process.cwd());
console.log("🔗 DATABASE_URL:", process.env.DATABASE_URL);

app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? [
            "https://norlava.com",
            "https://www.norlava.com",
            "https://norlava.vercel.app",
            "https://abdelhak-zvmu.norlava.com",
            process.env.FRONTEND_URL || "https://norlava.com"
        ]
        : ["http://localhost:5173", "http://localhost:8080"],
    credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/facts', factsRoutes);

// Basic health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Voxterna Backend is running' });
});

// Database health check
app.get('/api/health-db', async (req, res) => {
    try {
        // Try a simple query
        const userCount = await prisma.user.count();
        res.json({ status: 'ok', userCount, message: 'Database connection successful' });
    } catch (error: any) {
        console.error("DB Health Check Failed:", error);
        res.status(500).json({
            status: 'error',
            message: 'Database connection failed',
            details: error?.message || String(error)
        });
    }
});

// Socket.io Connection
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join-profile', async (data: any) => {
        const username = typeof data === 'string' ? data : data.username;
        const visitorId = typeof data === 'object' ? data.visitorId : 'anonymous';

        // ISOLATION: Join a specific room for this visitor session
        const roomName = `${username}:${visitorId}`;

        socket.join(roomName);

        // Initialize empty session messages (fresh conversation each page load)
        sessionMessages.set(roomName, []);

        console.log(`User joined PRIVATE profile room: ${roomName} (Fresh session started)`);
    });

    socket.on('send-message', async (data: any) => {
        console.log("📩 Messaging Event Triggered");
        // console.log("📦 Data:", JSON.stringify(data, null, 2));

        const { profileId, message, senderIsUser, inputType, visitorId } = data;
        const roomName = `${profileId}:${visitorId}`; // The unique room

        // 1. Save message to DB
        const hostUser = await db.findUserByUsername(profileId);

        if (!hostUser) {
            console.error(`❌ Host user NOT FOUND for username: ${profileId}`);
            io.to(roomName).emit('receive-message', {
                id: "error-404",
                text: "Error: Host User not found in database.",
                isUser: false
            });
            return; // Stop processing
        } else {
            console.log(`✅ Host user found: ${hostUser.username} (${hostUser.id})`);
        }

        const hostId = hostUser.id;

        // Check for duplicate/similar questions BEFORE saving
        const sessionKey = roomName;
        const sessionHistory = sessionMessages.get(sessionKey) || [];

        const isDuplicateQuestion = hasSimilarQuestionBeenAsked(message, sessionHistory);
        if (isDuplicateQuestion && senderIsUser) {
            console.log("⚠️ Similar question detected in this session, continuing anyway...");
        }

        const savedMsg = await db.createMessage({
            content: message,
            isUser: senderIsUser,
            hostId: hostId,
            senderId: visitorId, // Track who sent it
            visitorId: visitorId // DB Isolation field
        });

        // Add to current session messages (for AI context only from this session)
        sessionHistory.push({
            content: message,
            isUser: senderIsUser
        });
        sessionMessages.set(sessionKey, sessionHistory);

        // 2. Broadcast to PRIVATE room
        io.to(roomName).emit('receive-message', {
            id: savedMsg.id,
            text: message,
            isUser: senderIsUser
        });

        // 3. AI Response (Real or Simulated)
        if (senderIsUser && hostUser) {
            const isSimulated = process.env.SIMULATED_AI === 'true';

            if (isSimulated) {
                console.log("⚡ SIMULATED AI MODE: Generating mock stream...");
                socket.emit('bot-typing', true);

                const mockResponses = [
                    "I hear you loud and clear! This is my simulated brain talking.",
                    "Hello! My OpenAI connection is currently offline, so I am running on backup power.",
                    "Voxterna is ready. How can I assist you in this simulated environment?",
                    "Voice interaction confirmed. Text delivery verified. Simulation complete."
                ];
                const responseText = mockResponses[Math.floor(Math.random() * mockResponses.length)];

                // Simulate streaming
                const tokens = responseText.split(' ');
                let fullSimResponse = "";

                (async () => {
                    for (const token of tokens) {
                        await new Promise(r => setTimeout(r, 150));
                        const t = token + " ";
                        fullSimResponse += t;
                        socket.emit('ai-token', { text: t });
                    }

                    socket.emit('bot-typing', false);

                    const aiMsg = await db.createMessage({
                        content: fullSimResponse.trim(),
                        isUser: false,
                        hostId: hostId,
                        senderId: "ai",
                        visitorId: visitorId  // Add visitor isolation
                    });

                    io.to(roomName).emit('receive-message', {
                        id: aiMsg.id,
                        text: fullSimResponse.trim(),
                        isUser: false,
                        completed: true
                    });

                    if (inputType === 'voice') {
                        io.to(roomName).emit('bot-speak', { text: fullSimResponse.trim() });
                    }
                })();
                return;
            }

            // Fetch profile for AI context
            const profile = await db.findProfileByUserId(hostUser.id);
            try {
                // 3.1 Use ONLY current session messages for AI context (not all database history)
                // This ensures each new page load is a fresh conversation
                const sessionKey = roomName;
                const sessionHistory = sessionMessages.get(sessionKey) || [];

                const history = sessionHistory
                    .map(m => `${m.isUser ? 'User' : 'You'}: ${m.content}`)
                    .join("\n");

                // Default context if training is empty
                let aiBrain = profile?.aiContext || `You are ${hostUser.firstName}. You are a helpful digital assistant.`;

                // Add learned facts from visitor interactions
                const learnedFacts = profile?.learnedFacts ? JSON.parse(profile.learnedFacts) : [];
                if (learnedFacts.length > 0) {
                    aiBrain += `\n\nFACTS I'VE LEARNED FROM VISITOR CONVERSATIONS:\n${learnedFacts.map((fact: string) => `• ${fact}`).join('\n')}`;
                }

                // Add writing style instruction if available
                if (profile?.writingStyle) {
                    aiBrain += `\n\nIMPORTANT: Write exactly like this sample. Copy the tone, style, and personality:\n"${profile.writingStyle}"`;
                }

                // Add instruction for "still learning" responses
                aiBrain += `\n\nWhen a visitor asks about something you don't know about the person you represent, respond warmly like: "I'm still learning more about that! ${hostUser.firstName} hasn't shared those details with me yet, but once they do, I'll let you know!"`;

                // Emit typing status to PRIVATE room
                io.to(roomName).emit('bot-typing', true);

                console.log("🤖 Asking Gemini (Streaming)...");

                // Get the Gemini model (gemini-pro is stable in v1 API)
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

                // Create the prompt with AI context AND History
                const prompt = `${aiBrain}\n\n[CONVERSATION HISTORY]\n${history}\n\n[CURRENT INTERACTION]\nUser: ${message}\nAssistant:`;

                // Stream the response
                const result = await model.generateContentStream(prompt);

                let fullResponse = "";

                for await (const chunk of result.stream) {
                    const chunkText = chunk.text();
                    if (chunkText) {
                        fullResponse += chunkText;
                        io.to(roomName).emit('ai-token', { text: chunkText });
                    }
                }

                console.log("✅ Gemini Stream Complete. Length:", fullResponse.length);

                io.to(roomName).emit('bot-typing', false);

                const aiMsg = await db.createMessage({
                    content: fullResponse,
                    isUser: false,
                    hostId: hostId,
                    senderId: "ai",
                    visitorId: visitorId // Associate AI reply with this visitor
                });

                // Add AI response to session history
                const sessionHistory2 = sessionMessages.get(roomName) || [];
                sessionHistory2.push({
                    content: fullResponse,
                    isUser: false
                });
                sessionMessages.set(roomName, sessionHistory2);

                io.to(roomName).emit('receive-message', {
                    id: aiMsg.id,
                    text: fullResponse,
                    isUser: false,
                    completed: true
                });

                if (inputType === 'voice') {
                    io.to(roomName).emit('bot-speak', { text: fullResponse });
                }

                // --- 4. FACT EXTRACTION FROM VISITOR MESSAGE ---
                // Extract facts from what the visitor said, but DON'T apply them to AI yet
                // The user must approve facts before they affect the AI
                (async () => {
                    try {
                        if (!profile) return;

                        const learningModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

                        // Extract facts about the HOST from what the visitor said
                        console.log("🧠 Analyzing visitor message for learnable facts...");
                        const factPrompt = `
                            Analyze this message sent to a digital avatar of "${hostUser.firstName}".
                            Extract any facts about ${hostUser.firstName} that the visitor revealed or mentioned.
                            
                            Message: "${message}"
                            
                            Rules:
                            1. EXTRACT facts about ${hostUser.firstName} ONLY (their traits, preferences, history, goals)
                            2. INCLUDE both explicit facts ("I go to Harvard") and soft facts ("You're really chill")
                            3. Convert 2nd person to 1st person (e.g., "You are creative" → "I am creative")
                            4. IGNORE temporary states, greetings, and compliments
                            5. IGNORE facts about the VISITOR themselves
                            
                            Output ONLY the fact statement (one per line if multiple facts).
                            If NO facts found, output "NONE".
                        `;

                        const factResult = await learningModel.generateContent(factPrompt);
                        const factText = factResult.response.text().trim();

                        if (factText && factText !== "NONE" && factText !== "NO") {
                            // Could be multiple facts, split by newline
                            const facts = factText.split('\n').filter(f => f.trim().length > 10);

                            // Load existing memories (approved facts/questions) to avoid adding what we already know
                            const existingMemories = await db.getMemories(profile.id);
                            const knownContent = existingMemories.map((m: any) => m.content.toLowerCase());
                            const knownPrompts = existingMemories.map((m: any) => m.prompt?.toLowerCase());

                            for (const fact of facts) {
                                const cleanFact = fact.trim();
                                const lowerFact = cleanFact.toLowerCase();

                                // 1. CHECK IF WE ALREADY KNOW THIS (Approved Memory)
                                // Fuzzy check: if any existing memory contains 80% of the words or vice versa
                                const alreadyKnown = knownContent.some((k: string) => k.includes(lowerFact) || lowerFact.includes(k));
                                const alreadyAsked = knownPrompts.some((p: string) => p && (p.includes(lowerFact) || lowerFact.includes(p)));

                                if (alreadyKnown || alreadyAsked) {
                                    console.log(`🧠 SKIPPED (Already Known): "${cleanFact}"`);
                                    continue;
                                }

                                console.log(`💡 PENDING FACT FOR APPROVAL: "${cleanFact}"`);

                                // 2. CHECK PENDING LIST (Deduplication against DB)
                                // We check if this specific fact is already in the 'LEARNED_FROM_GUEST' memories
                                // We already loaded 'existingMemories' above, which includes 'LEARNED_FROM_GUEST'
                                // So we just need to check if we are adding it twice in this same loop (rare but possible)

                                // Actually, 'existingMemories' in line 343 gets ALL memories.
                                // We already checked 'alreadyKnown' (lines 351-354).
                                // So if we reached here, it's NEW to the database.

                                // Save directly to Memory Table
                                await db.createMemory({
                                    profileId: profile.id,
                                    type: 'LEARNED_FROM_GUEST', // This makes it show up in Pending list
                                    prompt: 'Fact extracted from conversation',
                                    content: cleanFact
                                });

                                console.log(`✅ Pending fact saved to DB: "${cleanFact}"`);
                            }
                        } else {
                            console.log("🧠 No new facts extracted from this message.");
                        }

                    } catch (err) {
                        console.error("⚠️ Fact extraction failed:", err);
                    }
                })();

            } catch (error) {
                console.error("Gemini Error:", error);

                const errString = String(error);
                let userMsg = "(System Error)";

                if (errString.includes("401")) userMsg = "Error: Invalid API Key.";
                if (errString.includes("429")) userMsg = "Error: Rate Limit Exceeded.";
                if (errString.includes("API_KEY")) userMsg = "Error: Gemini API Key not configured.";

                socket.emit('bot-typing', false);

                io.to(roomName).emit('receive-message', {
                    id: "error-" + Date.now(),
                    text: userMsg,
                    isUser: false
                });
            }
        }
    });

    // ==================== VOICE MODE HANDLERS ====================

    /**
     * Start Live Voice Session
     * Uses Web Speech API + Gemini 2.0 Flash + Natural TTS
     */
    socket.on('start-voice-session', async (data: any) => {
        const { username, visitorId } = data;
        const sessionKey = `${username}:${visitorId}`;
        const roomName = sessionKey;

        console.log(`🎙️ Starting voice session: ${sessionKey}`);

        try {
            // Get host user
            const hostUser = await db.findUserByUsername(username);
            if (!hostUser) {
                socket.emit('voice-error', { error: 'Host user not found' });
                return;
            }

            // Create new live session
            const liveSession = new GeminiLiveSession({
                hostId: hostUser.id.toString(),
                visitorId,
                username,
                onTextResponse: (text: string) => {
                    // Stream text chunks for display
                    io.to(roomName).emit('voice-text-chunk', { text });
                },
                onAudioResponse: (audioData: Buffer) => {
                    // Send complete text for TTS
                    io.to(roomName).emit('voice-audio-response', {
                        audioData: audioData.toString('base64')
                    });
                },
                onError: (error: Error) => {
                    console.error('❌ Voice session error:', error);
                    io.to(roomName).emit('voice-error', { error: error.message });
                }
            });

            await liveSession.initialize();
            liveSessions.set(sessionKey, liveSession);

            socket.emit('voice-session-ready');
            console.log(`✅ Voice session ready: ${sessionKey}`);

        } catch (error) {
            console.error('❌ Failed to start voice session:', error);
            socket.emit('voice-error', { error: 'Failed to initialize voice session' });
        }
    });

    /**
     * Process Voice Text Input (from Web Speech API)
     */
    socket.on('voice-text-input', async (data: any) => {
        const { username, visitorId, text } = data;
        const sessionKey = `${username}:${visitorId}`;

        const session = liveSessions.get(sessionKey);
        if (!session) {
            console.warn('❌ No active voice session for:', sessionKey);
            socket.emit('voice-error', { error: 'No active voice session' });
            return;
        }

        try {
            await session.processText(text);
        } catch (error) {
            console.error('❌ Error processing voice text:', error);
            socket.emit('voice-error', { error: 'Failed to process voice input' });
        }
    });

    /**
     * Process Voice Text Input (hybrid mode)
     * User can type while in voice mode
     */
    socket.on('voice-text-input', async (data: any) => {
        const { username, visitorId, message } = data;
        const sessionKey = `${username}:${visitorId}`;
        const roomName = sessionKey;

        const session = liveSessions.get(sessionKey);
        if (!session) {
            socket.emit('voice-error', { error: 'No active voice session' });
            return;
        }

        try {
            // Emit user message to room
            io.to(roomName).emit('voice-user-message', { text: message });

            // Process through Gemini Live
            await session.processText(message);
        } catch (error) {
            console.error('❌ Error processing voice text:', error);
            socket.emit('voice-error', { error: 'Failed to process text' });
        }
    });

    /**
     * End Voice Session
     */
    socket.on('end-voice-session', async (data: any) => {
        const { username, visitorId } = data;
        const sessionKey = `${username}:${visitorId}`;

        const session = liveSessions.get(sessionKey);
        if (session) {
            await session.end();
            liveSessions.delete(sessionKey);
            console.log(`👋 Ended voice session: ${sessionKey}`);
        }

        socket.emit('voice-session-ended');
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);

        // Cleanup any active voice sessions for this socket
        // Note: In production, you'd want to track socket.id -> sessionKey mapping
        liveSessions.forEach(async (session, key) => {
            if (key.includes(socket.id)) {
                await session.end();
                liveSessions.delete(key);
            }
        });
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Voxterna Backend running on port ${PORT}`);
});

export { app, io };
