import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";

interface Avatar3DProps {
  gender?: "male" | "female" | "neutral";
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
  className?: string;
  isSpeaking?: boolean;
}

export const Avatar3D = ({
  gender = "neutral",
  size = "md",
  animated = true,
  className,
  isSpeaking = false,
}: Avatar3DProps) => {
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
    xl: "w-48 h-48",
  };

  const colors = {
    male: {
      primary: "from-neon-blue to-neon-cyan",
      accent: "bg-neon-blue",
    },
    female: {
      primary: "from-neon-purple to-pink-500",
      accent: "bg-neon-purple",
    },
    neutral: {
      primary: "from-neon-cyan to-neon-purple",
      accent: "bg-neon-cyan",
    },
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!avatarRef.current) return;
      const { left, top, width, height } = avatarRef.current.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;

      // Calculate normalized position (-1 to 1)
      const x = (e.clientX - centerX) / (window.innerWidth / 2);
      const y = (e.clientY - centerY) / (window.innerHeight / 2);

      setEyePosition({ x: x * 5, y: y * 5 }); // Limit movement range
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Blink animation
  useEffect(() => {
    const interval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 200);
    }, 4000); // Blink every 4s
    return () => clearInterval(interval);
  }, []);

  const mouthVariants = {
    idle: { scaleY: 0.1 },
    speaking: {
      scaleY: [0.2, 0.8, 0.3, 0.7, 0.2],
      transition: { duration: 0.5, repeat: Infinity }
    }
  };

  return (
    <motion.div
      ref={avatarRef}
      className={cn("relative", sizeClasses[size], className)}
      animate={animated ? { y: [0, -10, 0] } : {}}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Glow effect */}
      <div
        className={cn(
          "absolute inset-0 rounded-full bg-gradient-to-br opacity-50 blur-2xl",
          colors[gender].primary
        )}
      />

      {/* Avatar container */}
      <div
        className={cn(
          "relative rounded-full bg-gradient-to-br p-1",
          colors[gender].primary
        )}
      >
        <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden relative">
          {/* Cute face */}
          <svg viewBox="0 0 100 100" className="w-4/5 h-4/5">
            {/* Face */}
            <circle cx="50" cy="50" r="40" fill="hsl(var(--muted))" />

            {/* Eyes Group */}
            <g style={{ transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)` }}>
              {/* Left Eye */}
              <motion.ellipse
                cx="35"
                cy="45"
                rx="6"
                ry={isBlinking ? 0.5 : 8}
                fill="hsl(var(--foreground))"
              />
              {/* Right Eye */}
              <motion.ellipse
                cx="65"
                cy="45"
                rx="6"
                ry={isBlinking ? 0.5 : 8}
                fill="hsl(var(--foreground))"
              />

              {/* Eye sparkles (hide when blinking) */}
              {!isBlinking && (
                <>
                  <circle cx="37" cy="42" r="2" fill="white" opacity="0.8" />
                  <circle cx="67" cy="42" r="2" fill="white" opacity="0.8" />
                </>
              )}
            </g>

            {/* Blush */}
            <circle cx="25" cy="55" r="6" fill="hsl(var(--neon-purple))" opacity="0.3" />
            <circle cx="75" cy="55" r="6" fill="hsl(var(--neon-purple))" opacity="0.3" />

            {/* Mouth */}
            <motion.path
              d="M 35 65 Q 50 80 65 65"
              fill="none"
              stroke="hsl(var(--foreground))"
              strokeWidth="3"
              strokeLinecap="round"
              variants={mouthVariants}
              initial="idle"
              animate={isSpeaking ? "speaking" : "idle"}
              style={{ originX: 0.5, originY: 0.5 }} // Pivot for scaling
            />
          </svg>
        </div>
      </div>

      {/* Floating particles */}
      {animated && (
        <>
          <motion.div
            className={cn("absolute w-2 h-2 rounded-full", colors[gender].accent)}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              x: [0, -20, -30],
              y: [0, -30, -50],
            }}
            transition={{ duration: 2, repeat: Infinity, delay: 0 }}
            style={{ top: "20%", left: "10%" }}
          />
          <motion.div
            className={cn("absolute w-1.5 h-1.5 rounded-full", colors[gender].accent)}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              x: [0, 20, 30],
              y: [0, -20, -40],
            }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            style={{ top: "30%", right: "10%" }}
          />
          <motion.div
            className={cn("absolute w-1 h-1 rounded-full", colors[gender].accent)}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              x: [0, -15, -25],
              y: [0, -25, -45],
            }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            style={{ top: "40%", left: "20%" }}
          />
        </>
      )}
    </motion.div>
  );
};
