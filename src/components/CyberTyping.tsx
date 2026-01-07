
import { motion } from "framer-motion";

export const CyberTyping = () => {
    return (
        <div className="flex items-center gap-1 h-6">
            <span className="text-xs text-neon-cyan/80 font-mono mr-2 animate-pulse">AI PROCESSING</span>
            {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                    key={i}
                    className="w-1 bg-neon-cyan"
                    animate={{
                        height: ["4px", "16px", "4px"],
                        opacity: [0.3, 1, 0.3],
                        backgroundColor: ["#00f3ff", "#bc13fe", "#00f3ff"]
                    }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.1,
                        ease: "easeInOut"
                    }}
                />
            ))}
        </div>
    );
};
