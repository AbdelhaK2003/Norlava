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

const corsOptions = {
    origin: function (origin: any, callback: any) {
        // Allow all in dev/production for debugging 500s easily
        // In strict prod, you'd verify against the list, but for now we want to see the error.
        callback(null, true);
    },
    credentials: true
};

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: corsOptions
});

const PORT = 3000;

console.log("🔍 Server Starting...");
console.log("📂 Current Working Directory:", process.cwd());
console.log("🔗 DATABASE_URL:", process.env.DATABASE_URL);

// Apply CORS middleware explicitly
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable pre-flight for all routes

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
                aiBrain += `\n\nGUIDELINES FOR ANSWERS:
                1. **GENERAL KNOWLEDGE**: If the user asks about general topics (science, history, math), answer directly.
                2. **FACT ASSERTION**: If the user TELLS you something about ${hostUser.firstName} (e.g., "I know he likes sushi"), accept it tentatively. Say: "Oh, I didn't know that! I'll make a note of it." DO NOT say "I'm still learning".
                3. **PERSONAL QUESTIONS**: If the user ASKS about ${hostUser.firstName} and you don't know the answer:
                   - Respond with a natural, cool vibe. Examples: "That's a great question! He hasn't told me that yet.", "I'm actually not sure, he kept that a secret from me!", "Good one. I'll have to ask him about that."
                   - CRITICAL: You MUST include the phrase "didn't tell me" OR "hasn't told me" OR "hasn't shared" so I can track this.
                   - Do NOT make up facts.`;

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
                        // Filter out commands from user view if streaming? 
                        // For simplicity, we just stream everything, then hide it in frontend?
                        // Or better: We strip it from the stream.
                        fullResponse += chunkText;

                        // Simple hiding strategy: Don't emit tokens that look like command parts if possible.
                        // But commands are usually at the end. 
                        io.to(roomName).emit('ai-token', { text: chunkText });
                    }
                }

                console.log("✅ Gemini Stream Complete. Length:", fullResponse.length);

                // --- CHECK FOR TRAINING COMMANDS (Hidden from User) ---
                let finalVisibleResponse = fullResponse;

                if (data.isTrainingMode) {
                    const commandRegex = /\[(RESOLVED_QUESTION|RESOLVED_FACT|DELETE_MEMORY):([^\]]+)\]/g;
                    let match;
                    while ((match = commandRegex.exec(fullResponse)) !== null) {
                        const [fullCmd, action, params] = match;
                        console.log(`🛠️ Executing Training Command: ${action} -> ${params}`);

                        // Remove command from visible text
                        finalVisibleResponse = finalVisibleResponse.replace(fullCmd, '').trim();

                        try {
                            if (action === 'RESOLVED_QUESTION') {
                                // Format: ID:Answer
                                const firstColon = params.indexOf(':');
                                if (firstColon > -1) {
                                    const id = params.substring(0, firstColon);
                                    const answer = params.substring(firstColon + 1);
                                    await prisma.memory.update({
                                        where: { id },
                                        data: { type: 'QUESTION', content: answer }
                                    });
                                    // Refresh context
                                    await db.refreshAiContext(profile.id);
                                }
                            } else if (action === 'RESOLVED_FACT') {
                                const id = params;
                                await prisma.memory.update({
                                    where: { id },
                                    data: { type: 'BIOGRAPHY' }
                                });
                                await db.refreshAiContext(profile.id);
                                io.to(roomName).emit('receive-message', {
                                    id: "sys-conf-" + Date.now(),
                                    text: `✅ [SYSTEM] Fact Confirmed!`,
                                    isUser: false
                                });
                            } else if (action === 'DELETE_MEMORY') {
                                const id = params;
                                await db.deleteMemory(id);
                                io.to(roomName).emit('receive-message', {
                                    id: "sys-del-" + Date.now(),
                                    text: `🗑️ [SYSTEM] Memory Deleted.`,
                                    isUser: false
                                });
                            }
                        } catch (err) {
                            console.error("❌ Failed to execute training command:", err);
                        }
                    }
                }

                io.to(roomName).emit('bot-typing', false);

                const aiMsg = await db.createMessage({
                    content: finalVisibleResponse, // Save only visible part
                    isUser: false,
                    hostId: hostId,
                    senderId: "ai",
                    visitorId: visitorId
                });

                // Add AI response to session history
                const sessionHistory2 = sessionMessages.get(roomName) || [];
                sessionHistory2.push({
                    content: finalVisibleResponse,
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

                // --- 3.2 DETECT UNKNOWN QUESTIONS (Fallback Trigger) ---
                // If AI used the fallback phrase, we capture the user's question as a GUEST_QUESTION
                // Updated phrases to match "Cool" responses
                const fallbackPhrases = ["didn't tell me", "hasn't told me", "hasn't shared", "still learning", "kept that a secret", "have to ask him"];
                const contentLower = fullResponse.toLowerCase();

                if (fallbackPhrases.some(phrase => contentLower.includes(phrase))) {
                    console.log("🤔 AI used fallback. Capturing question for Host...");

                    (async () => {
                        try {
                            if (!profile) return; // Fix: Ensure profile exists

                            const pendingQuestions = await db.getMemories(profile.id);
                            const existing = pendingQuestions.find((m: any) =>
                                m.type === 'GUEST_QUESTION' &&
                                m.prompt === message // Exact match on question
                            );

                            if (!existing) {
                                await db.createMemory({
                                    profileId: profile.id,
                                    type: 'GUEST_QUESTION',
                                    prompt: message, // The visitor's question
                                    content: '' // No answer yet
                                });
                                console.log(`📝 Captured GUEST_QUESTION: "${message}"`);

                                if (data.isTrainingMode || senderIsUser) {
                                    io.to(roomName).emit('receive-message', {
                                        id: "sys-q-" + Date.now(),
                                        text: `❓ [SYSTEM] New Question Captured: "${message}"`,
                                        isUser: false
                                    });
                                }
                            } else {
                                console.log(`⏩ Skipped duplicate question: "${message}"`);
                            }
                        } catch (err) {
                            console.error("Failed to capture question:", err);
                        }
                    })();
                }

                // --- 4. FACT EXTRACTION FROM VISITOR MESSAGE ---
                (async () => {
                    try {
                        console.log("🔍 [Fact Probe] Starting extraction check...");
                        if (!profile) {
                            console.error("❌ [Fact Probe] Profile is missing!");
                            return;
                        }

                        const learningModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

                        // Extract facts about the HOST from what the visitor said
                        const factPrompt = `
                            Analyze this message sent to a digital avatar of "${hostUser.firstName}".
                            Extract ANY meaningful information, claims, or relationship details about ${hostUser.firstName} that the visitor is sharing.
                            
                            Message: "${message}"
                            
                            Rules:
                            1. Extract facts about ${hostUser.firstName} OR the relationship (e.g., "I am his brother" -> "Visitor is brother").
                            2. Convert to 1st person perspective from the Avatar's view (e.g. "Visitor says you like pizza" -> "I like pizza").
                            3. Be generous! If the visitor says "You are nice", extract "I am nice".
                            4. IGNORE pure greetings ("Hello") or questions.
                            
                            Output ONLY the fact statement (one per line).
                            If NO facts, output "NONE".
                        `;

                        console.log("🔍 [Fact Probe] Sending prompt to Gemini...");
                        const factResult = await learningModel.generateContent(factPrompt);
                        const factText = factResult.response.text().trim();
                        console.log(`🔍 [Fact Probe] Raw Output: "${factText}"`);

                        if (factText && !factText.includes("NONE") && factText.length > 5) {
                            const facts = factText.split('\n').filter(f => f.trim().length > 5);
                            console.log(`🔍 [Fact Probe] Candidates found: ${facts.length}`);

                            const existingMemories = await db.getMemories(profile.id);
                            const knownContent = existingMemories.map((m: any) => m.content.toLowerCase());

                            for (const fact of facts) {
                                const cleanFact = fact.trim();
                                const lowerFact = cleanFact.toLowerCase();

                                // Relaxed check: Only skip if EXACT match or very high overlap
                                const alreadyKnown = knownContent.some((k: string) => k === lowerFact);

                                if (alreadyKnown) {
                                    console.log(`🧠 SKIPPED (Exact Match): "${cleanFact}"`);
                                    continue;
                                }

                                console.log(`💡 PENDING FACT FOR APPROVAL: "${cleanFact}"`);

                                await db.createMemory({
                                    profileId: profile.id,
                                    type: 'LEARNED_FROM_GUEST',
                                    prompt: 'Fact extracted from conversation',
                                    content: cleanFact
                                });

                                console.log(`✅ Pending fact saved to DB: "${cleanFact}"`);

                                // NEW: Notify Host immediately if in Training Mode or just for debugging feedback
                                // We check if the sender is the User (Host) or if we want to confirm to Visitor?
                                // Actually, only show this if senderIsUser (Trainer) or if we want to debug.
                                // For now, let's emit a special 'debug-event' or just a system message?
                                // A system message is safest.
                                if (data.isTrainingMode || senderIsUser) {
                                    io.to(roomName).emit('receive-message', {
                                        id: "sys-" + Date.now(),
                                        text: `📝 [SYSTEM] Extracted Fact: "${cleanFact}"`,
                                        isUser: false
                                    });
                                }
                            }
                        } else {
                            console.log("🧠 [Fact Probe] No meaningful facts found in output.");
                        }

                    } catch (err) {
                        console.error("⚠️ [Fact Probe] Failed:", err);
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
