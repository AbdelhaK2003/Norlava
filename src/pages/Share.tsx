import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { GlassCard } from "@/components/GlassCard";
import { Avatar3D } from "@/components/Avatar3D";
import { Button } from "@/components/ui/button";
import {
  Copy,
  Check,
  Instagram,
  Twitter,
  MessageCircle,
  Link2,
  Download,
  ArrowLeft,
} from "lucide-react";

const Share = () => {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const username = user.username || "johndoe";
  const profileLink = `${window.location.origin}/u/${username}`;

  const copyLink = () => {
    navigator.clipboard.writeText(profileLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOptions = [
    {
      name: "Instagram Story",
      icon: Instagram,
      color: "from-pink-500 to-purple-500",
      description: "Share as a story with your followers",
    },
    {
      name: "Twitter/X",
      icon: Twitter,
      color: "from-blue-400 to-blue-600",
      description: "Tweet your AI avatar link",
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "from-green-400 to-green-600",
      description: "Send to friends and groups",
    },
  ];

  return (
    <div className="min-h-screen p-4 bg-grid relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
          style={{ top: "20%", right: "10%" }}
        />
        <motion.div
          className="absolute w-80 h-80 bg-neon-cyan/10 rounded-full blur-3xl"
          animate={{ y: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
          style={{ bottom: "20%", left: "10%" }}
        />
      </div>

      <div className="max-w-2xl mx-auto pt-8 relative z-10">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft size={18} />
            Back
          </Button>
          <Logo size="md" />
        </motion.div>

        {/* Preview Card */}
        <GlassCard className="p-8 mb-8" glow>
          <h1 className="text-2xl font-bold text-center mb-6">
            Share Your <span className="gradient-text">Digital Self</span>
          </h1>

          {/* Story Preview */}
          <div className="flex justify-center mb-8">
            <motion.div
              className="relative w-64 h-96 rounded-3xl overflow-hidden bg-gradient-to-b from-card to-background border border-glass-border"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {/* Story content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <div className="mb-4">
                  <Avatar3D size="lg" />
                </div>
                <h2 className="text-xl font-bold mb-2">{user.firstName || "John Doe"}</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Chat with my AI avatar
                </p>
                <div className="glass-card px-4 py-2 text-xs">
                  <span className="gradient-text font-semibold">
                    {profileLink.replace("https://", "")}
                  </span>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-4 left-4 right-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-neon p-0.5">
                  <div className="w-full h-full rounded-full bg-card" />
                </div>
                <span className="text-xs font-medium">{username}</span>
              </div>
            </motion.div>
          </div>

          {/* Download Button */}
          <Button variant="outline" className="w-full gap-2 mb-4">
            <Download size={18} />
            Download Story Image
          </Button>
        </GlassCard>

        {/* Share Options */}
        <GlassCard className="p-6">
          <h2 className="font-semibold mb-4 text-center">
            Share on your favorite platform
          </h2>

          <div className="space-y-3 mb-6">
            {shareOptions.map((option, index) => (
              <motion.button
                key={option.name}
                className="w-full glass-card p-4 flex items-center gap-4 hover:neon-glow transition-all"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center`}
                >
                  <option.icon size={24} className="text-white" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold">{option.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Copy Link */}
          <div className="flex gap-2">
            <div className="flex-1 glass-card px-4 py-3 flex items-center gap-2">
              <Link2 size={16} className="text-muted-foreground" />
              <span className="text-sm truncate">{profileLink}</span>
            </div>
            <Button variant="neon" onClick={copyLink} className="gap-2">
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default Share;
