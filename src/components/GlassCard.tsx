import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  neonBorder?: boolean;
  hover?: boolean;
}

export const GlassCard = ({
  children,
  className,
  glow = false,
  neonBorder = false,
  hover = false,
  ...props
}: GlassCardProps) => {
  return (
    <motion.div
      className={cn(
        "glass-card p-6",
        glow && "neon-glow",
        neonBorder && "neon-border",
        hover && "hover:bg-secondary/40 transition-colors cursor-pointer",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};
