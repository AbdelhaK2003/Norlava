import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import { Logo } from "@/components/Logo";
import { GlassCard } from "@/components/GlassCard";
import { Avatar3D } from "@/components/Avatar3D";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Copy,
  Check,
  Instagram,
  Twitter,
  MessageCircle,
  Link2,
  Download,
  ArrowLeft,
  Facebook,
  Ghost, // Snapchat
  Music2, // TikTok (Use Music icon as proxy or find better if available)
  Share2
} from "lucide-react";

const Share = () => {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const username = user.username || "johndoe";

  // Link to the ACTUAL interaction page
  const profileLink = `${window.location.origin}/interact/${username}`;

  const cardRef = useRef<HTMLDivElement>(null);

  const copyLink = () => {
    navigator.clipboard.writeText(profileLink);
    setCopied(true);
    toast.success("Link copied! Ready for your Bio.");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;

    setIsDownloading(true);
    try {
      // Small delay to ensure rendering
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        backgroundColor: null, // Transparent bg if possible, or style checks
        scale: 2, // Retinat quality
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `voxterna-${username}-share.png`;
      link.click();

      toast.success("Image downloaded! Ready for your Story.");
    } catch (err) {
      console.error("Failed to generate image", err);
      toast.error("Failed to generate image.");
    } finally {
      setIsDownloading(false);
    }
  };

  const shareOptions = [
    {
      name: "Instagram Story",
      icon: Instagram,
      color: "from-pink-500 via-red-500 to-yellow-500",
      action: () => {
        handleDownloadImage();
        toast.info("Image saved! Post it to your Story with the link.");
      }
    },
    {
      name: "Snapchat",
      icon: Ghost,
      color: "from-yellow-300 to-yellow-500 text-black",
      action: () => {
        handleDownloadImage();
        toast.info("Image saved! Post it to Snap with the link.");
      }
    },
    {
      name: "TikTok Bio",
      icon: Music2,
      color: "from-black to-gray-800 border border-white/20",
      action: () => {
        copyLink();
        toast.info("Link copied! Add it to your TikTok bio.");
      }
    },
    {
      name: "Twitter / X",
      icon: Twitter,
      color: "from-blue-400 to-blue-600",
      action: () => {
        const text = `Chat with my AI Digital Twin on Voxterna! Ask me anything. 🤖✨\n\n${profileLink}`;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
      }
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "from-green-400 to-green-600",
      action: () => {
        const text = `Check out my AI Digital Twin! Chat here: ${profileLink}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      }
    },
    {
      name: "Facebook",
      icon: Facebook,
      color: "from-blue-600 to-blue-800",
      action: () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileLink)}`, '_blank');
      }
    },
    {
      name: "Discord",
      icon: Share2, // Generic share icon for Discord usually just link copy
      color: "from-indigo-500 to-indigo-700",
      action: () => {
        copyLink();
        toast.info("Link copied! Paste it in Discord.");
      }
    }
  ];

  return (
    <div className="min-h-screen p-4 bg-black relative overflow-hidden font-outfit text-white">
      {/* Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-neon-purple/20 rounded-full blur-[120px] opacity-40 animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-neon-cyan/20 rounded-full blur-[120px] opacity-40 animate-pulse-slow delay-1000"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
      </div>

      <div className="max-w-4xl mx-auto pt-4 relative z-10 flex flex-col md:flex-row gap-8 items-start">

        {/* LEFT COLUMN: PREVIEW CARD (Visible) */}
        <div className="w-full md:w-auto flex flex-col items-center gap-6">
          <div className="flex w-full items-center justify-between md:hidden mb-4">
            <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 text-white/60 hover:text-white pl-0">
              <ArrowLeft size={18} /> Back
            </Button>
            <Logo size="sm" />
          </div>

          {/* THE CARD TO DOWNLAOD */}
          <div
            ref={cardRef}
            className="relative w-[320px] h-[568px] rounded-[32px] overflow-hidden bg-gradient-to-br from-gray-900 to-black border border-white/10 shadow-2xl flex flex-col items-center text-center p-8 justify-between group"
          >
            {/* Card Content Bg */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neon-purple/20 via-transparent to-transparent opacity-60"></div>

            {/* Top Branding */}
            <div className="relative z-10 pt-4 opacity-80">
              <Logo size="sm" />
            </div>

            {/* Center Content */}
            <div className="relative z-10 flex flex-col items-center gap-6 mt-4">
              <div className="w-32 h-32 rounded-full border-4 border-white/10 bg-black/50 overflow-hidden shadow-[0_0_30px_rgba(188,19,254,0.3)] relative">
                {/* Avatar Fallback for Image Gen (WebGL often fails in html2canvas without tweaks) */}
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neon-purple/20 to-neon-cyan/20">
                  <span className="text-4xl">🤖</span>
                  {/* Ideally we'd capture the canvas, but simplistic fallback is safer for v1 */}
                </div>
                <div className="absolute inset-0 opacity-80 mix-blend-overlay">
                  {/* Optional noise or texture */}
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                  {user.firstName || "My"} AI Twin
                </h2>
                <p className="text-sm text-white/70 max-w-[200px] leading-relaxed">
                  Ask me anything! I am fully trained and ready to chat.
                </p>
              </div>
            </div>

            {/* Bottom Link Badge */}
            <div className="relative z-10 mb-8 w-full">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 shadow-lg">
                <p className="text-xs text-white/50 uppercase tracking-widest mb-1">LINK</p>
                <p className="text-sm font-mono text-neon-cyan truncate px-2 font-bold">
                  norlava.com/interact/{username}
                </p>
              </div>
              <p className="text-[10px] text-white/30 mt-4 uppercase tracking-[0.2em]">POWERED BY VOXTERNA</p>
            </div>
          </div>

          <Button
            onClick={handleDownloadImage}
            className="w-full max-w-[320px] bg-white text-black hover:bg-white/90 font-semibold gap-2 shadow-lg hover:shadow-xl transition-all"
            disabled={isDownloading}
          >
            {isDownloading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            ) : <Download size={18} />}
            Download Image for Story
          </Button>
        </div>


        {/* RIGHT COLUMN: ACTIONS */}
        <div className="flex-1 w-full max-w-md pt-0 md:pt-12 space-y-8">
          <div className="hidden md:flex items-center justify-between mb-8">
            <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 text-white/60 hover:text-white pl-0">
              <ArrowLeft size={18} /> Back to Dashboard
            </Button>
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-2">Share Your Twin</h1>
            <p className="text-white/60">Get your AI out there! Post the image to your story and the link in your bio.</p>
          </div>

          {/* BIO LINK SECTION */}
          <GlassCard className="p-6 border-neon-cyan/20 bg-neon-cyan/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-neon-cyan/20 rounded-lg text-neon-cyan">
                <Link2 size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Bio Link</h3>
                <p className="text-xs text-white/50">Perfect for Instagram, TikTok & Twitter Bios</p>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 bg-black/40 rounded-lg border border-white/10 px-3 py-3 flex items-center overflow-hidden">
                <span className="text-sm font-mono text-white/80 truncate">
                  {profileLink}
                </span>
              </div>
              <Button onClick={copyLink} className="bg-neon-cyan text-black hover:bg-neon-cyan/90">
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </Button>
            </div>
          </GlassCard>

          {/* SOCIAL GRID */}
          <div>
            <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">Social Platforms</h3>
            <div className="grid grid-cols-2 gap-3">
              {shareOptions.map((option) => (
                <motion.button
                  key={option.name}
                  onClick={option.action}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex flex-col items-center gap-3 group text-center"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={`p-3 rounded-full bg-gradient-to-br ${option.color} text-white shadow-lg group-hover:shadow-[0_0_15px_currentColor] transition-shadow duration-300`}>
                    <option.icon size={20} fill="currentColor" strokeWidth={1.5} />
                  </div>
                  <span className="text-sm font-medium">{option.name}</span>
                </motion.button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Share;
