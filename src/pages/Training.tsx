import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Brain, Sparkles, Plus, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/lib/api";
import { GlassCard } from "@/components/GlassCard";

interface Memory {
    id: string;
    type: string;
    prompt: string;
    content: string;
}

const SUGGESTED_QUESTIONS = [
    "What is your biggest dream?",
    "What is your fondest childhood memory?",
    "What do you value most in friendship?",
    "How do you spend your perfect Sunday?",
    "What is a skill you want to learn?",
    "What are three words your friends would use to describe you?",
    "What is your favorite slang word or phrase?",
    "What is your biggest pet peeve?",
    "Tell me a joke you find funny.",
    "What is your opinion on pineapple on pizza?"
];

const Training = () => {
    const { toast } = useToast();
    const [memories, setMemories] = useState<Memory[]>([]);
    const [newThought, setNewThought] = useState("");
    const [selectedQuestion, setSelectedQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMemories();
    }, []);

    const fetchMemories = async () => {
        try {
            const { data } = await api.get('/training');
            setMemories(data);
        } catch (error) {
            console.error("Failed to fetch memories", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveThought = async () => {
        if (!newThought.trim()) return;
        try {
            await api.post('/training', {
                type: 'FREE_TEXT',
                prompt: 'Free Thought',
                content: newThought
            });
            toast({ title: "Thought Saved", description: "Your digital twin is learning..." });
            setNewThought("");
            fetchMemories();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to save thought." });
        }
    };

    const handleSaveAnswer = async () => {
        if (!selectedQuestion || !answer.trim()) return;
        try {
            await api.post('/training', {
                type: 'QUESTION',
                prompt: selectedQuestion,
                content: answer
            });
            toast({ title: "Memory Saved", description: "I've learned this about you." });
            setAnswer("");
            // Pick a new random question
            const nextQ = SUGGESTED_QUESTIONS[Math.floor(Math.random() * SUGGESTED_QUESTIONS.length)];
            setSelectedQuestion(nextQ);
            fetchMemories();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to save answer." });
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-8 bg-background relative overflow-hidden">
            <div className="max-w-4xl mx-auto relative z-10 space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <Link to="/dashboard">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ArrowLeft size={16} /> Back
                        </Button>
                    </Link>
                    <div className="flex items-center gap-2 text-neon-purple">
                        <Brain size={24} />
                        <h1 className="text-2xl font-bold">Training Center</h1>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">

                    {/* Section 1: Deep Deep Scan Interview Mode */}
                    <GlassCard className="p-6 space-y-4 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 to-transparent pointer-events-none" />

                        <div className="flex items-center gap-2 mb-4 relative z-10">
                            <Sparkles className="text-neon-cyan animate-pulse" size={24} />
                            <h2 className="text-xl font-semibold">Deep Scan Interview</h2>
                        </div>
                        <p className="text-muted-foreground text-sm relative z-10">
                            I will ask you a series of questions to understand who you really are. This is the fastest way to build my personality.
                        </p>

                        {!selectedQuestion ? (
                            <Button
                                onClick={() => setSelectedQuestion(SUGGESTED_QUESTIONS[Math.floor(Math.random() * SUGGESTED_QUESTIONS.length)])}
                                className="w-full relative z-10"
                                variant="neon"
                            >
                                Start Interview
                            </Button>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-4 relative z-10"
                            >
                                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                                    <h3 className="text-lg font-medium text-neon-cyan">{selectedQuestion}</h3>
                                </div>
                                <Textarea
                                    placeholder="Speak from your heart..."
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    className="min-h-[120px] text-lg"
                                    autoFocus
                                />
                                <div className="flex gap-3">
                                    <Button
                                        onClick={() => setSelectedQuestion(SUGGESTED_QUESTIONS[Math.floor(Math.random() * SUGGESTED_QUESTIONS.length)])}
                                        variant="ghost"
                                        className="flex-1"
                                    >
                                        Skip
                                    </Button>
                                    <Button
                                        onClick={handleSaveAnswer}
                                        className="flex-1"
                                        variant="neon"
                                        disabled={!answer.trim()}
                                    >
                                        Save & Next
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </GlassCard>

                    {/* Section 2: Brain Dump */}
                    <GlassCard className="p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Plus className="text-neon-purple" size={20} />
                            <h2 className="text-xl font-semibold">Brain Dump</h2>
                        </div>
                        <p className="text-muted-foreground text-sm">
                            Add random facts, beliefs, or rules for your AI to follow.
                        </p>
                        <Textarea
                            placeholder="e.g., 'I hate pineapple on pizza' or 'My favorite color is emerald green'..."
                            value={newThought}
                            onChange={(e) => setNewThought(e.target.value)}
                            className="min-h-[150px]"
                        />
                        <Button onClick={handleSaveThought} className="w-full" variant="outline">
                            <Save size={16} className="mr-2" />
                            Add to Memory
                        </Button>
                    </GlassCard>
                </div>

                {/* Section 3: Memory Stream */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-muted-foreground">Recent Memories</h3>
                    {loading ? (
                        <p>Loading brain...</p>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {memories.map((mem) => (
                                <GlassCard key={mem.id} className="p-4 relative group" hover>
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
                                            {mem.type}
                                        </div>
                                    </div>
                                    <h4 className="font-medium text-neon-cyan mb-2">{mem.prompt}</h4>
                                    <p className="text-sm text-foreground/80 line-clamp-3">{mem.content}</p>
                                </GlassCard>
                            ))}
                            {memories.length === 0 && (
                                <p className="text-muted-foreground text-sm col-span-full text-center py-8">
                                    No memories yet. Start teaching your twin!
                                </p>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Training;
