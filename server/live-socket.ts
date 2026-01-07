
import { Socket } from 'socket.io';
import WebSocket from 'ws';
import { db } from './db';

const GEMINI_URL = 'wss://generativelanguage.googleapis.com/v1alpha/models/gemini-2.0-flash-exp:bidiConnect';

export const setupLiveSocket = (io: any) => {
    const liveNamespace = io.of('/live');

    liveNamespace.on('connection', (socket: Socket) => {
        console.log('🎙️ User connected to Live Voice:', socket.id);

        let geminiWs: WebSocket | null = null;
        let profileId: string | null = null;

        socket.on('join-live', async (data: { profileId: string }) => {
            profileId = data.profileId;
            const apiKey = process.env.GEMINI_API_KEY;

            if (!apiKey) {
                console.error("❌ No Gemini API Key found");
                socket.emit('error', "Server configuration error");
                return;
            }

            // Fetch Host Context
            const hostUser = await db.findUserByUsername(profileId);
            const profile = hostUser ? await db.findProfileByUserId(hostUser.id) : null;

            const systemInstruction = profile?.aiContext || `You are ${profileId || "an AI assistant"}. Be helpful and concise.`;

            // Connect to Gemini
            const url = `${GEMINI_URL}?key=${apiKey}`;
            geminiWs = new WebSocket(url);

            geminiWs.on('open', () => {
                console.log("✅ Connected to Gemini Live API");

                // Initial Setup
                const setupMsg = {
                    setup: {
                        model: "models/gemini-2.0-flash-exp",
                        generationConfig: {
                            responseModalities: ["AUDIO"],
                            speechConfig: {
                                voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } } // "Puck", "Charon", "Kore", "Fenrir", "Aoede"
                            }
                        },
                        systemInstruction: {
                            parts: [{ text: systemInstruction }]
                        }
                    }
                };
                geminiWs?.send(JSON.stringify(setupMsg));
            });

            geminiWs.on('message', (data: Buffer) => {
                try {
                    const str = data.toString();
                    // console.log("Gemini Raw Msg:", str.substring(0, 100)); // Debug truncate
                    const response = JSON.parse(str);

                    // Handle Audio
                    if (response.serverContent?.modelTurn?.parts?.[0]?.inlineData) {
                        const audioBase64 = response.serverContent.modelTurn.parts[0].inlineData.data;
                        socket.emit('audio-chunk', audioBase64);
                    }

                    // Handle Text (Turn Complete)
                    if (response.serverContent?.turnComplete) {
                        socket.emit('turn-complete');
                    }

                } catch (e) {
                    // Start of audio stream is often binary raw PCM? 
                    // No, Gemini 2.0 API sends JSON with base64 audio usually.
                    // But checking for errors is good.
                }
            });

            geminiWs.on('error', (err) => {
                console.error("Gemini WS Error:", err);
                socket.emit('error', "AI Connection Error");
            });

            geminiWs.on('close', () => {
                console.log("Gemini Connection Closed");
            });
        });

        // Client sends audio (PCM/Base64)
        socket.on('audio-input', (base64Audio: string) => {
            if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
                // console.log("🎤 Audio chunk received from client, size:", base64Audio.length);
                const msg = {
                    realtimeInput: {
                        mediaChunks: [{
                            mimeType: "audio/pcm",
                            data: base64Audio
                        }]
                    }
                };
                geminiWs.send(JSON.stringify(msg));
            } else {
                console.warn("⚠️ Audio received but Gemini WS not open. State:", geminiWs?.readyState);
            }
        });

        socket.on('disconnect', () => {
            console.log("User disconnected from Live");
            if (geminiWs) geminiWs.close();
        });
    });
};
