import { useState, useRef, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { Avatar3D } from "@/components/Avatar3D";
import { ChatBubble } from "@/components/ChatBubble";
import { CyberTyping } from "@/components/CyberTyping";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Send,
    Sparkles,
    Zap,
    UserPlus,
    Rocket
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
        // Get or create persistent visitorId for this profile
        const storageKey = `visitor_${username}`;
        let currentVisitorId = localStorage.getItem(storageKey);

        if (!currentVisitorId) {
            currentVisitorId = uuidv4();
            localStorage.setItem(storageKey, currentVisitorId);
            console.log("🆕 New Visitor Session Started:", currentVisitorId);
        } else {
            console.log("♻️ Returning Visitor Session:", currentVisitorId);
        }

        setVisitorId(currentVisitorId);

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

    const navigate = useNavigate();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showCreatePrompt, setShowCreatePrompt] = useState(true);
    const [ctaDismissed, setCtaDismissed] = useState(false);

    // Auto-scroll logic
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Socket connection and load previous messages
    useEffect(() => {
        if (!username || !visitorId) return;

        // Load previous messages for this visitor
        api.get(`/user/messages/${username}/${visitorId}`)
            .then(res => {
                if (res.data && Array.isArray(res.data)) {
                    setMessages(res.data.map((msg: any) => ({
                        id: msg.id,
                        text: msg.content,
                        isUser: msg.isUser
                    })));
                }
            })
            .catch(err => console.log('No previous messages:', err));

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
            inputType,
            isTrainingMode // Pass training mode flag
        });
        setInputValue("");
    };

    return (
        <div className="h-screen w-screen overflow-hidden relative font-outfit bg-black">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>

            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,243,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

            {/* Main Container */}
            <div className="relative z-10 flex flex-col h-full">

                {/* Futuristic Header */}
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="p-6 border-b border-neon-cyan/10 flex items-center justify-between backdrop-blur-xl bg-black/40"
                >
                    <div className="flex items-center gap-4">
                        {/* Direct Avatar without circular frame */}
                        <motion.div
                            className="w-14 h-14 flex items-center justify-center"
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Avatar3D size="sm" isSpeaking={false} />
                        </motion.div>
                        <div>
                            <h3 className="font-bold text-2xl text-white tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                                {hostName}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-xs text-neon-cyan/70 font-mono tracking-wider">ACTIVE NOW</span>
                            </div>
                        </div>
                    </div>

                    {isTrainingMode && (
                        <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full">
                            <span className="text-xs font-mono text-yellow-400 tracking-wider">🛠️ TRAINING MODE</span>
                        </div>
                    )}
                </motion.div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 scrollbar-thin scrollbar-thumb-neon-cyan/20 scrollbar-track-transparent">
                    {messages.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="flex flex-col items-center justify-center h-[60vh] text-center space-y-8"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-full blur-3xl opacity-20"></div>
                                <Rocket size={80} className="relative text-neon-cyan animate-pulse" />
                            </div>
                            <div className="space-y-3">
                                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-cyan bg-clip-text text-transparent animate-gradient">
                                    Start talking with {hostName}
                                </h2>
                                <p className="text-gray-400 text-sm md:text-base max-w-md mx-auto font-mono tracking-wide">
                                    Say hello and start the conversation
                                </p>
                            </div>
                        </motion.div>
                    )}

                    <AnimatePresence mode="popLayout">
                        {messages.map((message, index) => (
                            <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[85%] md:max-w-[70%] group relative ${message.isUser ? '' : 'flex items-start gap-3'}`}>
                                    {!message.isUser && (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center flex-shrink-0 mt-1">
                                            <Zap size={16} className="text-black" />
                                        </div>
                                    )}
                                    <div className={`relative p-5 rounded-3xl backdrop-blur-md border transition-all duration-300 hover:scale-[1.02] ${message.isUser
                                            ? 'bg-gradient-to-br from-neon-purple/20 to-neon-purple/5 border-neon-purple/30 text-white rounded-br-md shadow-[0_0_20px_rgba(188,19,254,0.1)]'
                                            : 'bg-white/5 border-white/10 text-gray-100 rounded-bl-md shadow-[0_0_20px_rgba(0,243,255,0.05)]'
                                        }`}>
                                        <p className="text-base leading-relaxed tracking-wide">{message.text}</p>

                                        {/* Glow effect on hover */}
                                        <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${message.isUser
                                                ? 'bg-gradient-to-r from-neon-purple/0 via-neon-purple/10 to-neon-purple/0'
                                                : 'bg-gradient-to-r from-neon-cyan/0 via-neon-cyan/10 to-neon-cyan/0'
                                            }`}></div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {isTyping && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-start items-start gap-3"
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center flex-shrink-0 mt-1 animate-pulse">
                                <Zap size={16} className="text-black" />
                            </div>
                            <div className="bg-neon-cyan/5 border border-neon-cyan/20 p-5 rounded-3xl rounded-bl-md backdrop-blur-md">
                                <CyberTyping />
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* CTA Banner - Show after 7-8 messages */}
                {showCreatePrompt && !ctaDismissed && messages.length >= 7 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="mx-6 mb-4 p-6 bg-gradient-to-r from-neon-cyan/10 via-neon-purple/10 to-neon-cyan/10 border border-neon-cyan/30 rounded-2xl backdrop-blur-xl relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/5 to-neon-purple/5 animate-pulse"></div>
                        <div className="relative flex items-center justify-between flex-wrap gap-4">
                            <div className="flex-1 min-w-[200px]">
                                <h4 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                                    <Sparkles size={20} className="text-neon-cyan" />
                                    Impressed? Create Your Own AI Twin!
                                </h4>
                                <p className="text-sm text-gray-400 font-mono">Build your digital clone in minutes</p>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => {
                                        setShowCreatePrompt(false);
                                        setCtaDismissed(true);
                                    }}
                                    variant="ghost"
                                    className="text-gray-400 hover:text-white"
                                >
                                    Later
                                </Button>
                                <Button
                                    onClick={() => navigate('/register')}
                                    className="bg-gradient-to-r from-neon-cyan to-neon-purple text-black font-bold hover:shadow-[0_0_30px_rgba(0,243,255,0.5)] transition-all gap-2"
                                >
                                    <UserPlus size={18} />
                                    Create Your Twin
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Futuristic Input */}
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="p-6 pb-8 backdrop-blur-xl bg-black/40 border-t border-neon-cyan/10"
                >
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputValue, 'text'); }}
                        className="max-w-4xl mx-auto relative group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/20 to-neon-purple/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative">
                            <Input
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Type your message..."
                                className="bg-white/5 border-white/10 focus-visible:ring-2 focus-visible:ring-neon-cyan/50 text-base pl-6 pr-16 h-16 rounded-full shadow-2xl backdrop-blur-xl transition-all hover:bg-white/10 hover:border-neon-cyan/30 text-white placeholder:text-gray-500"
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={!inputValue.trim()}
                                className="absolute right-2 top-2 h-12 w-12 bg-gradient-to-r from-neon-cyan to-neon-purple text-black hover:shadow-[0_0_25px_rgba(0,243,255,0.6)] transition-all rounded-full disabled:opacity-30"
                            >
                                <Send size={20} />
                            </Button>
                        </div>
                    </form>

                    {/* Floating Join Button - Shows when CTA is dismissed but user has enough messages */}
                    {ctaDismissed && messages.length >= 7 && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex justify-center mt-4"
                        >
                            <Button
                                onClick={() => navigate('/register')}
                                variant="ghost"
                                className="text-neon-cyan hover:text-white border border-neon-cyan/30 hover:border-neon-cyan hover:bg-neon-cyan/10 rounded-full px-6 py-2 text-sm font-mono tracking-wider transition-all hover:shadow-[0_0_20px_rgba(0,243,255,0.3)]"
                            >
                                <UserPlus size={16} className="mr-2" />
                                Create Your Own Twin
                            </Button>
                        </motion.div>
                    )}

                    {/* Powered by badge */}
                    <div className="text-center mt-4">
                        <p className="text-xs text-gray-600 font-mono tracking-wider">
                            POWERED BY <span className="text-neon-cyan">NORLAVA</span>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Interact;
