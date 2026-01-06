import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams } from "react-router-dom";
import { Avatar3D } from "@/components/Avatar3D";
import { ChatBubble } from "@/components/ChatBubble";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles, MessageCircle } from "lucide-react";
import { socket } from "@/lib/api";

interface Message {
  id: number;
  text: string;
  isUser: boolean;
}

const PublicProfile = () => {
  const { username } = useParams(); // Note: treating as ID for MVP
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    // 1. Join Profile Room
    socket.connect();
    socket.emit('join-profile', username);

    // 2. Listen for messages
    socket.on('receive-message', (msg: any) => {
      setMessages((prev) => [...prev, {
        id: msg.id,
        text: msg.text,
        isUser: msg.isUser
      }]);
    });

    socket.on('bot-typing', (status: boolean) => {
      setIsTyping(status);
    });

    socket.on('bot-speak', (data: { duration: number }) => {
      setIsAvatarSpeaking(true);
      setTimeout(() => setIsAvatarSpeaking(false), data.duration);
    });

    return () => {
      socket.off('receive-message');
      socket.off('bot-typing');
      socket.off('bot-speak');
      socket.disconnect();
    };
  }, [username]);

  const sendMessage = () => {
    if (!inputValue.trim()) return;

    // Emit to backend
    socket.emit('send-message', {
      profileId: username,
      message: inputValue,
      senderIsUser: true
    });

    setInputValue("");
  };

  return (
    <div className="min-h-screen bg-grid relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-[500px] h-[500px] bg-neon-cyan/10 rounded-full blur-3xl"
          animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
          transition={{ duration: 15, repeat: Infinity }}
          style={{ top: "10%", right: "-10%" }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] bg-neon-purple/10 rounded-full blur-3xl"
          animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
          transition={{ duration: 12, repeat: Infinity }}
          style={{ bottom: "10%", left: "-10%" }}
        />
      </div>

      <div className="max-w-3xl mx-auto p-4 relative z-10">
        {/* Profile Header */}
        <motion.div
          className="text-center py-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex justify-center mb-4">
            <Avatar3D size="lg" isSpeaking={isAvatarSpeaking} />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            <span className="gradient-text">John Doe</span>'s AI
          </h1>
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            <Sparkles size={16} className="text-primary" />
            Powered by Norlava
          </p>
        </motion.div>

        {/* Chat Container */}
        <GlassCard className="p-0 overflow-hidden" glow>
          {/* Chat Header */}
          <div className="p-4 border-b border-glass-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <MessageCircle size={18} className="text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Chat with John's AI</h3>
              <p className="text-xs text-muted-foreground">
                Always online · Responds instantly
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
          </div>

          {/* Messages */}
          <div className="h-[400px] overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <ChatBubble
                key={message.id}
                message={message.text}
                isUser={message.isUser}
              />
            ))}
            {isTyping && <ChatBubble message="" isTyping />}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-glass-border">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex gap-3"
            >
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything about John..."
                className="flex-1"
              />
              <Button type="submit" variant="neon" size="icon">
                <Send size={18} />
              </Button>
            </form>
          </div>
        </GlassCard>

        {/* Footer */}
        <motion.p
          className="text-center mt-6 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Want your own AI avatar?{" "}
          <a href="/" className="text-primary hover:underline">
            Create one with Norlava
          </a>
        </motion.p>
      </div>
    </div>
  );
};

export default PublicProfile;
