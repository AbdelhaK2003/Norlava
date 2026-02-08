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
  Share2,
  Download,
  ArrowLeft,
  Link2
} from "lucide-react";

// Extracted Card Component for consistent rendering
const ShareCard = ({ user, username, profileLink }: { user: any, username: string, profileLink: string }) => {
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-card to-background border border-glass-border flex flex-col items-center justify-between py-10 px-6 shadow-2xl overflow-hidden rounded-[32px]">
      {/* Decorative BG in Capture */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-neon-purple/20 blur-[50px] rounded-full"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-neon-cyan/20 blur-[50px] rounded-full"></div>

      <div className="relative z-10 flex flex-col items-center gap-4 w-full">
        <Avatar3D size="lg" />
        <div className="text-center">
          <h2 className="text-2xl font-bold">{user.firstName}</h2>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">AI Digital Twin</p>
        </div>
      </div>

      <div className="relative z-10 text-center space-y-4">
        <h3 className="text-2xl font-bold leading-tight gradient-text">
          Chat with {user.firstName}'s<br />AI Twin
        </h3>
        <p className="text-sm text-muted-foreground px-4">
          Ask me anything! I am fully trained and ready to chat.
        </p>
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-center gap-2 text-xs font-mono text-neon-cyan opacity-80">
          <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse"></div>
          <span>voxterna.ai</span>
        </div>
      </div>
    </div>
  );
};

const Share = () => {
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const username = user.username || "johndoe";

  // The actual link to chat
  const profileLink = `${window.location.origin}/interact/${username}`;

  // Ref for the HIDDEN export card
  const exportCardRef = useRef<HTMLDivElement>(null);

  const copyLink = () => {
    navigator.clipboard.writeText(profileLink);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const generateImageValues = async () => {
    if (!exportCardRef.current) return null;
    try {
      // Small delay to ensure rendering
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(exportCardRef.current, {
        useCORS: true,
        backgroundColor: null,
        scale: 2, // High quality export
        width: 400, // Enforce capture width
        height: 700, // Enforce capture height
      });
      return canvas;
    } catch (err) {
      console.error("Capture failed", err);
      return null;
    }
  };

  const handleDownload = async () => {
    setIsSharing(true);
    const canvas = await generateImageValues();
    if (canvas) {
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `voxterna-${username}-share.png`;
      link.click();
      toast.success("Image downloaded!");
    } else {
      toast.error("Failed to generate image.");
    }
    setIsSharing(false);
  };

  const handleNativeShare = async () => {
    setIsSharing(true);
    try {
      const canvas = await generateImageValues();
      if (!canvas) throw new Error("Canvas generation failed");

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], `voxterna-${username}.png`, { type: "image/png" });
        const shareData = {
          title: `Chat with ${user.firstName}'s AI Twin`,
          text: `Talk to my custom AI Digital Twin on Voxterna! \n\n${profileLink}`,
          files: [file],
        };

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share(shareData);
          toast.success("Shared successfully!");
        } else {
          if (navigator.share) {
            await navigator.share({
              title: shareData.title,
              text: shareData.text,
              url: profileLink
            });
          } else {
            throw new Error("Web Share API not supported");
          }
        }
      }, "image/png");

    } catch (err) {
      console.error("Share failed:", err);
      if (String(err).includes("not supported")) {
        toast.info("Sharing not supported on this device. Copied link instead.");
        copyLink();
        handleDownload();
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="min-h-screen p-4 bg-grid relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
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

      {/* HIDDEN EXPORT CARD - Fixed Dimensions for Perfect Image */}
      <div style={{ position: "fixed", top: "-9999px", left: "-9999px" }}>
        <div ref={exportCardRef} style={{ width: "400px", height: "700px" }}>
          <ShareCard user={user} username={username} profileLink={profileLink} />
        </div>
      </div>

      <div className="max-w-xl mx-auto pt-8 relative z-10 w-full">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-6"
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

        {/* Preview Card Area */}
        <GlassCard className="p-6 md:p-8 flex flex-col items-center gap-8" glow>

          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">
              Share Your <span className="gradient-text">AI Twin</span>
            </h1>
            <p className="text-muted-foreground text-sm">
              Share this card on your story to let people chat with you!
            </p>
          </div>

          {/* VISIBLE PREVIEW CARD (Responsive) */}
          <div className="relative p-4 rounded-3xl border border-white/5 bg-black/20 w-full flex justify-center">
            <div className="w-full max-w-[320px] aspect-[9/16]">
              <ShareCard user={user} username={username} profileLink={profileLink} />
            </div>
          </div>

          {/* ACTIONS */}
          <div className="w-full space-y-3">
            <Button
              onClick={handleNativeShare}
              className="w-full h-12 text-lg bg-neon-cyan text-black hover:bg-neon-cyan/90 shadow-[0_0_20px_rgba(30,214,213,0.3)] animate-pulse-slow"
              disabled={isSharing}
            >
              {isSharing ? "Generating..." : (
                <>
                  <Share2 className="mr-2" size={20} />
                  Share Profile
                </>
              )}
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={handleDownload} disabled={isSharing}>
                <Download className="mr-2" size={16} /> Save Image
              </Button>
              <Button variant="outline" onClick={copyLink}>
                {copied ? <Check size={16} className="mr-2" /> : <Link2 size={16} className="mr-2" />}
                {copied ? "Copied" : "Copy Link"}
              </Button>
            </div>
          </div>

        </GlassCard>
      </div>
    </div>
  );
};

export default Share;
