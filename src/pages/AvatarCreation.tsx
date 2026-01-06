import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { GlassCard } from "@/components/GlassCard";
import { Avatar3D } from "@/components/Avatar3D";
import { Button } from "@/components/ui/button";
import { Check, Share2, Copy, ExternalLink, Sparkles } from "lucide-react";

const AvatarCreation = () => {
  const [isCreating, setIsCreating] = useState(true);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const profileLink = "norlava.ai/u/johndoe";

  useEffect(() => {
    if (isCreating) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsCreating(false);
            return 100;
          }
          return prev + 2;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isCreating]);

  const copyLink = () => {
    navigator.clipboard.writeText(`https://${profileLink}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const creatingSteps = [
    { threshold: 20, text: "Analyzing your personality..." },
    { threshold: 40, text: "Learning your interests..." },
    { threshold: 60, text: "Creating visual identity..." },
    { threshold: 80, text: "Training conversational style..." },
    { threshold: 100, text: "Finalizing your avatar..." },
  ];

  const currentStep =
    creatingSteps.find((step) => progress <= step.threshold)?.text ||
    "Complete!";

  if (isCreating) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-grid relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute w-[600px] h-[600px] bg-gradient-radial from-neon-cyan/20 to-transparent rounded-full blur-3xl"
            animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
            transition={{ duration: 10, repeat: Infinity }}
            style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
          />
        </div>

        <div className="text-center relative z-10">
          <motion.div
            className="mb-8"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Avatar3D size="xl" />
          </motion.div>

          <h1 className="text-3xl font-bold mb-4">
            Creating Your <span className="gradient-text">AI Avatar</span>
          </h1>

          <p className="text-muted-foreground mb-8">{currentStep}</p>

          <div className="w-64 mx-auto">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-neon rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">{progress}%</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-grid relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-96 h-96 bg-neon-cyan/10 rounded-full blur-3xl"
          style={{ top: "10%", left: "20%" }}
        />
        <motion.div
          className="absolute w-80 h-80 bg-neon-purple/10 rounded-full blur-3xl"
          style={{ bottom: "20%", right: "20%" }}
        />
      </div>

      <div className="max-w-2xl mx-auto pt-8 relative z-10">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Logo size="md" />
        </motion.div>

        <GlassCard className="p-8 text-center" glow neonBorder>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-medium mb-6"
          >
            <Check size={16} />
            Avatar Created Successfully!
          </motion.div>

          <div className="flex justify-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.3 }}
            >
              <Avatar3D size="xl" />
            </motion.div>
          </div>

          <motion.h1
            className="text-3xl font-bold mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Meet Your <span className="gradient-text">Digital Self</span>
          </motion.h1>

          <motion.p
            className="text-muted-foreground mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Your AI avatar is now ready to represent you online. Share your
            unique link with friends and visitors!
          </motion.p>

          {/* Profile Link */}
          <motion.div
            className="glass-card p-4 flex items-center justify-between mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <ExternalLink size={18} className="text-primary" />
              </div>
              <span className="text-sm font-medium">{profileLink}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyLink}
              className="gap-2"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            className="grid sm:grid-cols-2 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Button
              variant="neon"
              size="lg"
              onClick={() => navigate("/dashboard")}
              className="gap-2"
            >
              <Sparkles size={18} />
              Go to Dashboard
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate("/share")}
              className="gap-2"
            >
              <Share2 size={18} />
              Share on Social
            </Button>
          </motion.div>
        </GlassCard>
      </div>
    </div>
  );
};

export default AvatarCreation;
