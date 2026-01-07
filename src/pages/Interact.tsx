import { useState, useRef, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "react-router-dom";
import { Avatar3D } from "@/components/Avatar3D";
import { ChatBubble } from "@/components/ChatBubble";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Send,
    Mic,
    MicOff,
    MessageCircle,
    Volume2,
    VolumeX,
    X,
    Sparkles
} from "lucide-react";
import { io } from "socket.io-client";
import { api, socket as chatSocket } from "@/lib/api";

// Audio Configuration
const AUDIO_CONTEXT_OPTIONS = { sampleRate: 16000 }; // Gemini expects 16kHz
const CHUNK_SIZE = 4096;

interface Message {
    id: string | number;
    text: string;
    isUser: boolean;
}

const Interact = () => {
    const { t } = useTranslation();
    const { username } = useParams();
    const [showChat, setShowChat] = useState(false);
    const [hostName, setHostName] = useState("");

    // Visitor Identity
    const [visitorId, setVisitorId] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);

    // Live Voice State
    const [isConnected, setIsConnected] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const nextStartTimeRef = useRef<number>(0);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, showChat]);

    useEffect(() => {
        const newVisitorId = uuidv4();
        console.log("🆕 New Visitor Session Started:", newVisitorId);
        setVisitorId(newVisitorId);

        if (username) {
            api.get(`/user/username/${username}`)
                .then(res => setHostName(res.data.firstName || username))
                .catch(() => setHostName(username));
        }

        // Initialize Live Socket
        const liveSocket = io(
            process.env.NODE_ENV === 'production'
                ? (import.meta.env.VITE_BACKEND_URL || window.location.origin)
                : "http://localhost:3000",
            { path: '/socket.io', withCredentials: true }
        ).connect();

        // Connect to namespace manually if needed, but standard socket.io client handles namespace by string
        const liveNs = io(
            (process.env.NODE_ENV === 'production'
                ? (import.meta.env.VITE_BACKEND_URL || window.location.origin)
                : "http://localhost:3000") + "/live",
            { withCredentials: true }
        );

        socketRef.current = liveNs;

        liveNs.on('connect', () => {
            console.log("🔌 Connected to Live Voice Backend");
            setIsConnected(true);
        });

        liveNs.on('audio-chunk', async (base64Audio: string) => {
            if (isMuted) return;
            await playAudioChunk(base64Audio);
        });

        liveNs.on('turn-complete', () => {
            // Optional: Handle interaction markers
        });

        return () => {
            stopRecording();
            liveNs.disconnect();
            if (audioContextRef.current) audioContextRef.current.close();
        };
    }, [username, isMuted]);

    // --- Audio Playback Logic ---
    const playAudioChunk = async (base64String: string) => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') await ctx.resume();

        // Decode Base64
        const binaryString = window.atob(base64String);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Decode Audio Data (PCM 24kHz or similar from Gemini)
        // Note: Gemini Live sends PCM. If it's pure PCM, we might need a custom raw player.
        // However, the current setup assumes Gemini sends WAV or decodable chunks OR we use a raw buffer.
        // Let's assume raw PCM (16-bit, 24kHz usually). audioContext.decodeAudioData usually expects headers.
        // If raw, we need to manually float it.
        // For simplicity v1: Try decodeAudioData (assuming server wraps it or sends header).
        // If fails, we implement raw PCM player.

        // Actually, for real-time PCM without headers, decodeAudioData fails.
        // We will create a Float32Array from Int16Array (standard PCM)
        const pcm16 = new Int16Array(bytes.buffer);
        const float32 = new Float32Array(pcm16.length);
        for (let i = 0; i < pcm16.length; i++) {
            float32[i] = pcm16[i] / 32768; // Convert to -1..1 range
        }

        const buffer = ctx.createBuffer(1, float32.length, 24000); // Gemini usually 24kHz output
        buffer.getChannelData(0).set(float32);

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);

        // Schedule smoothness
        const now = ctx.currentTime;
        // If next start time is in the past, reset it to now
        const startTime = Math.max(now, nextStartTimeRef.current);

        source.start(startTime);
        nextStartTimeRef.current = startTime + buffer.duration;

        setIsAvatarSpeaking(true);
        source.onended = () => {
            if (ctx.currentTime >= nextStartTimeRef.current || nextStartTimeRef.current - ctx.currentTime < 0.1) {
                setIsAvatarSpeaking(false);
            }
        };
    };

    // --- Audio Capture Logic (ScriptProcessor for simplicity in React) ---
    const startRecording = async () => {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            }
            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') await ctx.resume();

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    autoGainControl: true,
                    noiseSuppression: true
                }
            });
            streamRef.current = stream;

            const source = ctx.createMediaStreamSource(stream);

            // Join the Live Room
            socketRef.current?.emit('join-live', { profileId: username });

            // Use ScriptProcessor (Legacy but works everywhere without external worklet files)
            const processor = ctx.createScriptProcessor(4096, 1, 1);

            processor.onaudioprocess = (e) => {
                if (!isListening) return;

                const inputData = e.inputBuffer.getChannelData(0);

                // Convert Float32 (-1..1) to Int16 PCM
                const pcmData = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                    const s = Math.max(-1, Math.min(1, inputData[i]));
                    pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }

                // Convert to Base64
                const binary = String.fromCharCode(...new Uint8Array(pcmData.buffer));
                const base64 = window.btoa(binary);

                socketRef.current?.emit('audio-input', base64);
            };

            source.connect(processor);
            processor.connect(ctx.destination); // Destination is strictly for keeping the node alive in some browsers

            setIsListening(true);
            console.log("🎙️ Live Recording Started");

        } catch (err) {
            console.error("Mic Error:", err);
            alert("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setIsListening(false);
        console.log("mic stopped");
    };

    const toggleListening = () => {
        if (isListening) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    // Keep Chat Functionality for Text Fallback
    const handleSendMessage = (text: string) => {
        if (!text.trim()) return;
        // ... (Keep existing chat logic if mixed, but user said voice focused)
        // For simplicity, we just clear input for now as focus is Voice
        setInputValue("");
        chatSocket.emit('send-message', {
            profileId: username,
            message: text,
            senderIsUser: true,
            visitorId,
            inputType: 'text'
        });
    };

    return (
        <div className="min-h-screen bg-grid relative overflow-hidden flex flex-col items-center justify-center">
            {/* Background effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute w-[800px] h-[800px] bg-neon-cyan/5 rounded-full blur-3xl"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 10, repeat: Infinity }}
                    style={{ top: "10%", left: "50%", transform: "translateX(-50%)" }}
                />
            </div>

            {/* Main Full-Screen Avatar */}
            <div className="relative z-0 flex-1 flex items-center justify-center w-full">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1 }}
                    className="relative"
                >
                    <div className="scale-110 md:scale-150 transform transition-transform duration-700">
                        <Avatar3D size="xl" isSpeaking={isAvatarSpeaking} />
                    </div>

                    {/* Status Indicator */}
                    <motion.div
                        className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-center w-full whitespace-nowrap"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        {isListening ? (
                            <span className="text-xl font-medium text-red-500 animate-pulse uppercase tracking-widest">Listening...</span>
                        ) : isAvatarSpeaking ? (
                            <span className="text-xl font-medium gradient-text uppercase tracking-widest">Speaking...</span>
                        ) : (
                            <span className="text-muted-foreground text-sm uppercase tracking-widest">
                                {isConnected ? "Tap Mic to Chat" : "Connecting..."}
                            </span>
                        )}
                    </motion.div>
                </motion.div>
            </div>

            {/* Floating Controls Bar */}
            <motion.div
                className="relative z-20 mb-24 md:mb-12 flex items-center gap-6"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                <Button
                    variant="outline"
                    size="icon"
                    className="w-12 h-12 rounded-full border-glass-border bg-black/20 backdrop-blur-md"
                    onClick={() => setIsMuted(!isMuted)}
                >
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </Button>

                <motion.button
                    className={`w-24 h-24 rounded-full flex items-center justify-center transition-all bg-gradient-to-br shadow-lg ${isListening
                        ? "from-red-500 to-red-600 shadow-red-500/20"
                        : "from-primary to-secondary shadow-primary/20"
                        }`}
                    onClick={toggleListening}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    animate={isListening ? { boxShadow: ["0 0 0 0 rgba(255,50,50,0.4)", "0 0 0 20px rgba(255,50,50,0)"] } : {}}
                    transition={isListening ? { duration: 1.5, repeat: Infinity } : {}}
                >
                    {isListening ? <MicOff size={36} className="text-white" /> : <Mic size={36} className="text-black" />}
                </motion.button>

                <Button
                    variant="outline"
                    size="icon"
                    className="w-12 h-12 rounded-full border-glass-border bg-black/20 backdrop-blur-md"
                    onClick={() => setShowChat(true)}
                >
                    <MessageCircle size={20} />
                </Button>
            </motion.div>

            {/* Chat Overlay (Preserved for text fallback) */}
            <AnimatePresence>
                {showChat && (
                    <motion.div
                        className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={(e) => {
                            if (e.target === e.currentTarget) setShowChat(false);
                        }}
                    >
                        <motion.div
                            className="w-full max-w-md"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                        >
                            <GlassCard className="h-[600px] flex flex-col p-0 overflow-hidden" glow>
                                <div className="p-4 border-b border-glass-border flex items-center justify-between bg-black/20">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                            <Sparkles size={14} className="text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-sm">{hostName}</h3>
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                                <span className="text-[10px] text-muted-foreground">Live</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setShowChat(false)}
                                        className="h-8 w-8 hover:bg-white/10"
                                    >
                                        <X size={16} />
                                    </Button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    <div className="text-center text-muted-foreground text-sm mt-10">
                                        Use the microphone for real-time voice chat.
                                    </div>
                                </div>

                                <div className="p-4 border-t border-glass-border bg-black/20">
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            handleSendMessage(inputValue);
                                        }}
                                        className="flex gap-2"
                                    >
                                        <Input
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            placeholder="Type a message..."
                                            className="flex-1 bg-black/20 border-glass-border focus-visible:ring-primary/50"
                                        />
                                        <Button type="submit" variant="neon" size="icon">
                                            <Send size={18} />
                                        </Button>
                                    </form>
                                </div>
                            </GlassCard>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default Interact;
