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
import { socket, api } from "@/lib/api";

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
    const [hostVoiceId, setHostVoiceId] = useState<string | null>(null);

    // Visitor Identity
    const [visitorId, setVisitorId] = useState("");

    const [messages, setMessages] = useState<Message[]>([

    ]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, showChat]);

    const recognitionRef = useRef<any>(null);
    const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

    // Initialize Speech Recognition
    useEffect(() => {
        // PERMANENT ISOLATION: Always generate a new ID on mount
        // This ensures every refresh or new tab is a "new" visitor
        const newVisitorId = uuidv4();
        console.log("🆕 New Visitor Session Started:", newVisitorId);
        setVisitorId(newVisitorId);

        // Fetch host profile
        if (username) {
            // Use api client to respect base URL
            api.get(`/user/username/${username}`)
                .then(res => {
                    setHostName(res.data.firstName || username);
                    if (res.data.profile?.voiceId) {
                        setHostVoiceId(res.data.profile.voiceId);
                        console.log("🎙️ Host has cloned voice:", res.data.profile.voiceId);
                    }
                })
                .catch(() => setHostName(username));
        }
    }, [username]);

    // ... (State definitions) ...

    const speakText = async (text: string) => {
        if (hostVoiceId) {
            // Use Server-Side Cloned Voice
            try {
                console.log("🗣️ Generating Cloned Voice...");
                setIsAvatarSpeaking(true);
                const response = await api.post('/voice/speak', {
                    text,
                    voiceId: hostVoiceId
                }, {
                    responseType: 'blob'
                });

                const audioUrl = URL.createObjectURL(response.data);
                const audio = new Audio(audioUrl);

                audio.onended = () => {
                    setIsAvatarSpeaking(false);
                    URL.revokeObjectURL(audioUrl);
                };

                audio.play();
                return; // Skip browser TTS
            } catch (err) {
                console.error("❌ Cloned Voice Failed, falling back to browser:", err);
                setIsAvatarSpeaking(false);
                // Fallthrough to browser TTS
            }
        }

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Stop any previous speech

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1;
            utterance.pitch = 1;
            // Use current UI language for speech
            utterance.lang = t('languageCode') || 'en-US';

            // Find a good voice (optional, but helps quality)
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.lang.startsWith(utterance.lang));
            if (preferredVoice) utterance.voice = preferredVoice;

            utterance.onstart = () => setIsAvatarSpeaking(true);
            utterance.onend = () => setIsAvatarSpeaking(false);
            utterance.onerror = (e) => console.error("🗣️ TTS Error:", e);

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
            inputType // 'voice' or 'text'
        });

        setInputValue("");
    };

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert("Speech recognition is not supported in your browser");
            return;
        }

        if (isListening) {
            setIsListening(false); // This flag prevents auto-restart in onend
            recognitionRef.current.stop();
        } else {
            setIsListening(true); // This flag enables auto-restart
            recognitionRef.current.start();
        }
    };

    const stopSpeaking = () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setIsAvatarSpeaking(false);
        }
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
                    {/* Avatar takes up significant space */}
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
                            <span className="text-xl font-medium text-primary animate-pulse">{t('interact.listening')}</span>
                        ) : isAvatarSpeaking ? (
                            <span className="text-xl font-medium gradient-text">{t('interact.speaking')}</span>
                        ) : (
                            <span className="text-muted-foreground text-sm">{t('interact.tapToSpeak')}</span>
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

            {/* Chat Overlay */}
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
                                {/* Chat Header */}
                                <div className="p-4 border-b border-glass-border flex items-center justify-between bg-black/20">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                            <Sparkles size={14} className="text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-sm">{hostName}</h3>
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                                <span className="text-[10px] text-muted-foreground">{t('interact.online')}</span>
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

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {messages.map((message) => (
                                        <ChatBubble
                                            key={message.id}
                                            message={message.text}
                                            isUser={message.isUser}
                                        />
                                    ))}
                                    {isTyping && <ChatBubble message="" isTyping />}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input */}
                                <div className="p-4 border-t border-glass-border bg-black/20">
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            handleSendMessage(inputValue, 'text');
                                        }}
                                        className="flex gap-2"
                                    >
                                        <Input
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            placeholder={t('interact.typeMessage')}
                                            className="flex-1 bg-black/20 border-glass-border focus-visible:ring-primary/50"
                                            autoFocus
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
