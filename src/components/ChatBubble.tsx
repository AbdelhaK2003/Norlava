import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  message: string;
  isUser?: boolean;
  isTyping?: boolean;
}

export const ChatBubble = ({ message, isUser = false, isTyping = false }: ChatBubbleProps) => {
  return (
    <motion.div
      className={cn(
        "flex",
        isUser ? "justify-end" : "justify-start"
      )}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className={cn(
          "chat-bubble",
          isUser ? "chat-bubble-user" : "chat-bubble-ai"
        )}
      >
        {isTyping ? (
          <div className="flex gap-1">
            <motion.span
              className="w-2 h-2 bg-current rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0 }}
            />
            <motion.span
              className="w-2 h-2 bg-current rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
            />
            <motion.span
              className="w-2 h-2 bg-current rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
            />
          </div>
        ) : (
          <p className="text-sm leading-relaxed">{message}</p>
        )}
      </div>
    </motion.div>
  );
};
