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
    Zap
} from "lucide-react";
import { socket, api } from "@/lib/api";

interface Message {
    id: string | number;
    text: string;
    isUser: boolean;
}

const Interact = () => {
    const { t } = useTranslation();
    const { username } = useParams();
    const [hostName, setHostName] = useState("");
    const [visitorId, setVisitorId] = useState("");

    useEffect(() => {
        const newVisitorId = uuidv4();
        console.log("🆕 New Visitor Session Started:", newVisitorId);
        setVisitorId(newVisitorId);

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
            setMessages((prev) => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg && !lastMsg.isUser && lastMsg.id === -1) {
                    return [...prev.slice(0, -1), { ...lastMsg, text: lastMsg.text + data.text }];
                }
                return [...prev, { id: -1, text: data.text, isUser: false }];
            });
        });

        socket.on('receive-message', (msg: any) => {
            if (msg.isUser) {
                setMessages((prev) => [...prev, { id: msg.id, text: msg.text, isUser: msg.isUser }]);
            } else {
                setMessages((prev) => {
                    const lastMsg = prev[prev.length - 1];
                    if (lastMsg && !lastMsg.isUser && lastMsg.id === -1) {
                        return [...prev.slice(0, -1), { ...lastMsg, id: msg.id, text: msg.text }];
                    }
                    return prev;
                });
            }
        });

        socket.on('bot-speak', (data: { text: string }) => {
            speakText(data.text);
        });

        socket.on('bot-typing', (status: boolean) => {
            setIsTyping(status);
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

    const handleSendMessage = (text: string, inputType: 'voice' | 'text' = 'text') => {
        if (!text.trim()) return;
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
        <div className="h-screen w-screen bg-black overflow-hidden flex flex-col md:flex-row relative">
            {/* Background Texture */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none z-0"></div>

            {/* LEFT SIDE: AVATAR HUD */}
            <div className="relative flex-1 h-1/2 md:h-full flex items-center justify-center p-4">
                {/* HUD Circle Background */}
                <motion.div
                    className="absolute w-[300px] h-[300px] md:w-[600px] md:h-[600px] rounded-full border border-neon-cyan/20"
                    animate={isListening ? { scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                />

                {/* 3D Avatar */}
                <motion.div
                    className="relative z-10"
                    animate={isListening ? { scale: 1.2, filter: "drop-shadow(0 0 20px #00f3ff)" } : { scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="scale-125 md:scale-150">
                        <Avatar3D size="xl" isSpeaking={isAvatarSpeaking} />
                    </div>
                </motion.div>

                {/* Call Button (Floating in HUD) */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
                    <motion.button
                        className={`group relative flex items-center justify-center gap-3 px-8 py-4 rounded-full backdrop-blur-md border border-white/10 transition-all ${isListening ? "bg-red-500/20 border-red-500/50" : "bg-neon-cyan/10 border-neon-cyan/30 hover:bg-neon-cyan/20"
                            }`}
                        onClick={toggleListening}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {isListening ? (
                            <>
                                <MicOff className="w-6 h-6 text-red-400" />
                                <span className="font-mono text-red-400 tracking-wider">END CALL</span>
                            </>
                        ) : (
                            <>
                                <Zap className="w-6 h-6 text-neon-cyan group-hover:animate-pulse" />
                                <span className="font-mono text-neon-cyan tracking-wider">INITIATE CALL</span>
                            </>
                        )}
                    </motion.button>
                </div>
            </div>

            {/* RIGHT SIDE: CHAT TERMINAL */}
            <div className="flex-1 h-1/2 md:h-full bg-black/40 backdrop-blur-xl border-t md:border-t-0 md:border-l border-white/10 flex flex-col relative z-10">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/60">
                    <div className="flex items-center gap-3">
                        <Sparkles size={16} className="text-neon-purple animate-pulse" />
                        <div>
                            <h3 className="font-mono text-sm text-neon-cyan tracking-widest uppercase">{hostName || "SYSTEM"}</h3>
                            <div className="text-[10px] text-muted-foreground font-mono">ONLINE // V 2.5.0</div>
                        </div>
                    </div>
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-ping"></div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center opacity-30 mt-10">
                            <Sparkles size={48} className="mb-4" />
                            <p className="font-mono text-sm">INITIALIZING CONVERSATION PROTOCOL...</p>
                        </div>
                    )}

                    {messages.map((message) => (
                        <motion.div
                            key={message.id}
                            initial={{ opacity: 0, x: message.isUser ? 20 : -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[85%] p-4 rounded-xl backdrop-blur-sm border ${message.isUser
                                    ? 'bg-neon-purple/10 border-neon-purple/30 text-white rounded-br-none'
                                    : 'bg-white/5 border-white/10 text-gray-200 rounded-bl-none'
                                }`}>
                                <p className="text-sm leading-relaxed">{message.text}</p>
                            </div>
                        </motion.div>
                    ))}

                    {isTyping && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-start"
                        >
                            <div className="bg-neon-cyan/5 border border-neon-cyan/20 p-3 rounded-xl rounded-bl-none">
                                <CyberTyping />
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-white/10 bg-black/60">
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputValue, 'text'); }}
                        className="flex gap-4 relative"
                    >
                        <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="TRANSMIT MESSAGE..."
                            className="bg-white/5 border-white/10 focus-visible:ring-neon-cyan/50 font-mono text-sm pl-4 pr-12 h-12 rounded-lg"
                        />
                        <Button
                            type="submit"
                            size="icon"
                            className="absolute right-1 top-1 h-10 w-10 bg-transparent hover:bg-neon-cyan/20 text-neon-cyan"
                        >
                            <Send size={18} />
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Interact;
