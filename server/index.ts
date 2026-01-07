/* eslint-disable no-console */
import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { setupLiveSocket } from './live-socket';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import trainingRoutes from './routes/training';
import { db } from './db';

// Initialize Google Gemini AI (SDK automatically uses appropriate API version)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production'
            ? [process.env.FRONTEND_URL || "https://your-app.vercel.app", "https://norlava.com", "https://www.norlava.com"]
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
        ? [process.env.FRONTEND_URL || "https://your-app.vercel.app", "https://norlava.com", "https://www.norlava.com"]
        : ["http://localhost:5173", "http://localhost:8080"],
    credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/training', trainingRoutes);

// Basic health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Voxterna Backend is running' });
});

// Socket.io Connection
setupLiveSocket(io);

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join-profile', async (data: any) => {
        const username = typeof data === 'string' ? data : data.username;
        const visitorId = typeof data === 'object' ? data.visitorId : 'anonymous';

        // ISOLATION: Join a specific room for this visitor session
        const roomName = `${username}:${visitorId}`;

        socket.join(roomName);
        console.log(`User joined PRIVATE profile room: ${roomName}`);
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

        const savedMsg = await db.createMessage({
            content: message,
            isUser: senderIsUser,
            hostId: hostId,
            senderId: visitorId, // Track who sent it
            visitorId: visitorId // DB Isolation field
        });

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
                        senderId: "ai"
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
                // 3.1 Fetch Conversation History (ISOLATED)
                const rawHistory = await db.getMessagesForVisitor(hostUser.id, visitorId);

                const history = rawHistory
                    .slice(-15)
                    .map(m => `${m.senderId === 'ai' || !m.isUser ? 'You' : 'User'}: ${m.content}`)
                    .join("\n");


                // Default context if training is empty
                const aiBrain = profile?.aiContext || `You are ${hostUser.firstName}. You are a helpful digital assistant.`;

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

                io.to(roomName).emit('receive-message', {
                    id: aiMsg.id,
                    text: fullResponse,
                    isUser: false,
                    completed: true
                });

                if (inputType === 'voice') {
                    io.to(roomName).emit('bot-speak', { text: fullResponse });
                }

                // --- 4. ADAPTIVE LEARNING LOOP (Background) ---
                // We don't await this, let it run in background to keep chat fast
                (async () => {
                    try {
                        const learningModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

                        // A: Check for Facts
                        console.log("🧠 Adaptive Learning: Analyzing message for new facts...");
                        const learningPrompt = `
                            Analyze the following user message sent to a digital avatar of ${hostUser.firstName}.
                            Does the message contain a specific FACT about ${hostUser.firstName} (the Host) that the avatar should remember?
                            
                            Message: "${message}"
                            
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

                        // B: Check for Questions (New Feature)
                        const questionPrompt = `
                            Analyze the following message from a visitor to ${hostUser.firstName}'s AI.
                            Is the visitor asking a specific, meaningful question about ${hostUser.firstName}'s life, identity, or preferences that requires a permanent answer?
                            
                            Message: "${message}"
                            
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
                            if (profile) {
                                await db.createMemory({
                                    profileId: profile.id,
                                    type: 'LEARNED_FROM_GUEST',
                                    prompt: 'Learned from conversation',
                                    content: fact
                                });
                                // Refresh context for next time
                                await db.refreshAiContext(profile.id);
                            }
                        } else {
                            console.log("🧠 No new facts learned.");
                        }

                        if (question && question !== "NO") {
                            console.log(`❓ VISITOR ASKED: "${question}"`);
                            // START: Check if similar question already exists to avoid dupes (Simple check)
                            // Ideally we'd use embedding search, but for MVP string match or just save it
                            if (profile) {
                                await db.createMemory({
                                    profileId: profile.id,
                                    type: 'GUEST_QUESTION',
                                    prompt: question,
                                    content: "" // Empty content means it needs an answer from the host
                                });
                            }
                        }

                    } catch (err) {
                        console.error("⚠️ Adaptive Learning failed:", err);
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

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Voxterna Backend running on port ${PORT}`);
});

export { app, io };
