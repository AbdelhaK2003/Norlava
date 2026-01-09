import { useState, useRef, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "react-router-dom";
import { Avatar3D } from "@/components/Avatar3D";
import { ChatBubble } from "@/components/ChatBubble";
import { CyberTyping } from "@/components/CyberTyping";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Send,
    Mic,
    MicOff,
    Sparkles,
    Zap,
    X
} from "lucide-react";
import { socket, api } from "@/lib/api";

interface Message {
    id: string | number;
    text: string;
    isUser: boolean;
    isStreaming?: boolean;
}

const Interact = () => {
    const { t } = useTranslation();
    const { username } = useParams();
    const [hostName, setHostName] = useState("");
    const [visitorId, setVisitorId] = useState("");
    const [isTrainingMode, setIsTrainingMode] = useState(false);

    useEffect(() => {
        const newVisitorId = uuidv4();
        console.log("🆕 New Visitor Session Started:", newVisitorId);
        setVisitorId(newVisitorId);

        // Check for logged in user to detect Training Mode
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.username === username) {
                    setIsTrainingMode(true);
                    console.log("🛠️ TRAINING MODE ACTIVE");
                }
            } catch (e) {
                console.error("Invalid user session");
            }
        }

        if (username) {
            api.get(`/user/username/${username}`)
                .then(res => setHostName(res.data.firstName || username))
                .catch(() => setHostName(username));
        }
    }, [username]);

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);
    const [isListening, setIsListening] = useState(false);

    // Auto-scroll logic
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const recognitionRef = useRef<any>(null);

    // Initialize Speech Recognition
    useEffect(() => {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = t('languageCode') || 'en-US';

            recognitionRef.current.onstart = () => {
                console.log("🎙️ Voice: Listening started");
                setIsListening(true);
            };

            recognitionRef.current.onresult = (event: any) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript.trim()) {
                    handleSendMessage(finalTranscript, 'voice');
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("🎙️ Voice Error:", event.error);
                if (event.error === 'not-allowed') {
                    alert("Allow microphone access to use voice mode.");
                    setIsListening(false);
                }
            };

            recognitionRef.current.onend = () => {
                if (isListening) {
                    try { recognitionRef.current.start(); } catch (e) { /* ignore */ }
                }
            };
        }
    }, [t]);

    // Socket connection
    useEffect(() => {
        if (!visitorId) return;

        socket.connect();
        socket.emit('join-profile', { username, visitorId });

        socket.on('ai-token', (data: { text: string }) => {
            setProcessing(false);
            setMessages((prev) => {
                const lastMsg = prev[prev.length - 1];
                // Check if last message is our streaming AI message
                if (lastMsg && !lastMsg.isUser && lastMsg.isStreaming) {
                    return [...prev.slice(0, -1), { ...lastMsg, text: lastMsg.text + data.text }];
                }
                // Start new streaming message with STABLE ID (timestamp) prevents flicker
                return [...prev, {
                    id: Date.now(),
                    text: data.text,
                    isUser: false,
                    isStreaming: true
                }];
            });
        });

        socket.on('receive-message', (msg: any) => {
            setProcessing(false);
            if (msg.isUser) return; // Ignore user loopback

            setMessages((prev) => {
                const lastMsg = prev[prev.length - 1];
                // If we have a streaming message, just finalize text and stop streaming.
                // KEY FIX: WE KEEP THE LOCAL ID (lastMsg.id) to prevent React re-mount/flicker.
                if (lastMsg && !lastMsg.isUser && lastMsg.isStreaming) {
                    return [...prev.slice(0, -1), {
                        ...lastMsg,
                        text: msg.text,
                        isStreaming: false
                    }];
                }
                // Fallback: If no stream existed, append new message
                return [...prev, { id: msg.id, text: msg.text, isUser: false }];
            });
        });

        socket.on('bot-speak', (data: { text: string }) => {
            speakText(data.text);
        });

        socket.on('bot-typing', (status: boolean) => {
            setIsTyping(status);
            if (!status) setProcessing(false); // Safety net
        });

        return () => {
            socket.off('receive-message');
            socket.off('ai-token');
            socket.off('bot-typing');
            socket.off('bot-speak');
            socket.disconnect();
        };
    }, [username, visitorId]);

    const speakText = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1;
            utterance.pitch = 1;
            utterance.lang = t('languageCode') || 'en-US';

            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.lang.startsWith(utterance.lang));
            if (preferredVoice) utterance.voice = preferredVoice;

            utterance.onstart = () => setIsAvatarSpeaking(true);
            utterance.onend = () => setIsAvatarSpeaking(false);
            window.speechSynthesis.speak(utterance);
        }
    };

    const [processing, setProcessing] = useState(false);

    const handleSendMessage = (text: string, inputType: 'voice' | 'text' = 'text') => {
        if (!text.trim()) return;

        // Optimistic UI Update
        const tempId = Date.now();
        setMessages(prev => [...prev, { id: tempId, text: text, isUser: true }]);

        setProcessing(true);

        socket.emit('send-message', {
            profileId: username,
            message: text,
            senderIsUser: true,
            visitorId,
            inputType
        });
        setInputValue("");
    };

    const toggleListening = () => {
        if (!recognitionRef.current) return;
        if (isListening) {
            setIsListening(false);
            recognitionRef.current.stop();
        } else {
            setIsListening(true);
            recognitionRef.current.start();
        }
    };

    return (
        <div className="h-screen w-screen overflow-hidden relative font-outfit">
            {/* Global Background */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none z-0"></div>

            {/* ==================== 1. CHAT MODE (DEFAULT) ==================== */}
            <div className={`relative z-10 flex flex-col h-full transition-all duration-700 ${isListening ? 'scale-95 opacity-0 blur-sm pointer-events-none' : 'scale-100 opacity-100'}`}>
                {/* Header */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between backdrop-blur-md sticky top-0 z-20 bg-background/50">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gradient-neon p-[2px]">
                                <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                                    <Sparkles size={16} className="text-neon-cyan" />
                                </div>
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black animate-pulse"></div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg text-white tracking-wide">{hostName}</h3>
                            <div className="text-xs text-neon-cyan/60 font-mono tracking-widest">ONLINE</div>
                        </div>
                    </div>

                    <Button
                        onClick={toggleListening}
                        className="bg-neon-cyan/10 hover:bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 rounded-full px-6 gap-2 transition-all hover:shadow-[0_0_20px_rgba(0,243,255,0.3)]"
                    >
                        <Zap size={16} />
                        <span className="font-mono text-xs tracking-wider">INITIATE CALL</span>
                    </Button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-[50vh] text-center opacity-30">
                            <Sparkles size={64} className="mb-6 text-neon-purple animate-pulse" />
                            <p className="font-mono text-sm tracking-widest">SYSTEM READY</p>
                        </div>
                    )}

                    {messages.map((message) => (
                        <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[85%] md:max-w-[60%] p-4 rounded-2xl backdrop-blur-sm border transition-all duration-300 hover:scale-[1.01] ${message.isUser
                                ? 'bg-neon-purple/5 border-neon-purple/20 text-white rounded-br-none shadow-[0_0_15px_rgba(188,19,254,0.05)]'
                                : 'bg-white/5 border-white/10 text-gray-200 rounded-bl-none shadow-[0_0_15px_rgba(255,255,255,0.02)]'
                                }`}>
                                <p className="text-base leading-relaxed tracking-wide">{message.text}</p>
                            </div>
                        </motion.div>
                    ))}

                    {isTyping && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-start"
                        >
                            <div className="bg-neon-cyan/5 border border-neon-cyan/10 p-4 rounded-2xl rounded-bl-none">
                                <CyberTyping />
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 md:p-6 pb-8 backdrop-blur-sm sticky bottom-0 z-20">
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputValue, 'text'); }}
                        className="max-w-4xl mx-auto relative group"
                    >
                        <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Broadcast message..."
                            className="bg-white/5 border-white/10 focus-visible:ring-neon-cyan/30 text-base pl-6 pr-14 h-14 rounded-full shadow-lg backdrop-blur-xl transition-all group-hover:bg-white/10 group-hover:border-white/20"
                        />
                        <Button
                            type="submit"
                            size="icon"
                            className="absolute right-2 top-2 h-10 w-10 bg-neon-cyan text-black hover:bg-white transition-colors rounded-full shadow-lg"
                        >
                            <Send size={18} />
                        </Button>
                    </form>
                </div>
            </div>

            {/* ==================== 2. CALL MODE (OVERLAY) ==================== */}
            <AnimatePresence>
                {isListening && (
                    <motion.div
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                        transition={{ duration: 0.5, ease: "anticipate" }}
                        className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4"
                    >
                        {/* Live Grid Background */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,243,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)] pointer-events-none"></div>

                        {/* DEBUG STATUS */}
                        <div className="absolute top-4 left-4 font-mono text-[10px] text-white/30 z-50 text-left">
                            <p>STATUS: {socket.connected ? "CONNECTED" : "DISCONNECTED"}</p>
                            <p>{isTrainingMode ? "⚠️ TRAINING MODE ENABLED" : `VISITOR: ${visitorId.slice(0, 8)}...`}</p>
                        </div>

                        {/* Close Button */}
                        <div className="absolute top-8 right-8 z-50">
                            <Button
                                onClick={toggleListening}
                                variant="ghost"
                                className="text-white/50 hover:text-red-400 hover:bg-white/5 rounded-full p-4 h-auto border border-transparent hover:border-red-400/30 transition-all font-mono text-xs tracking-widest gap-2"
                            >
                                <X size={20} /> END CONNECTION
                            </Button>
                        </div>

                        {/* Avatar HUD */}
                        <div className="relative w-full max-w-lg aspect-square flex items-center justify-center">
                            {/* Spinning Rings */}
                            <motion.div
                                className="absolute inset-0 rounded-full border border-neon-cyan/20 border-t-neon-cyan/60"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            />
                            <motion.div
                                className="absolute inset-4 rounded-full border border-neon-purple/20 border-b-neon-purple/60"
                                animate={{ rotate: -360 }}
                                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                            />

                            {/* Avatar */}
                            <div className="relative z-10 scale-150">
                                <Avatar3D size="xl" isSpeaking={isAvatarSpeaking} />
                            </div>

                            {/* Live Transcript Log (Simulating HUD Data) */}
                            <div className="absolute -bottom-24 w-full text-center space-y-2">
                                {messages.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={messages.length}
                                        className="inline-block px-6 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md"
                                    >
                                        <p className={`font-mono text-sm max-w-sm truncate ${messages[messages.length - 1].isUser ? "text-white" : "text-neon-cyan"
                                            }`}>
                                            {messages[messages.length - 1].isUser
                                                ? `YOU: ${messages[messages.length - 1].text}`
                                                : `${(hostName || 'AI').toUpperCase()}: ${messages[messages.length - 1].text}`}
                                        </p>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Interact;
