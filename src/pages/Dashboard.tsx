import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { GlassCard } from "@/components/GlassCard";
import { Avatar3D } from "@/components/Avatar3D";
import { Statistics } from "@/components/Statistics";
import { PendingFacts } from "@/components/PendingFacts";
import { Button } from "@/components/ui/button";
import {
    Users,
    MessageSquare,
    Share2,
    Settings,
    Copy,
    Bot,
    LogOut,
    Check,
    Zap,
    ExternalLink,
    Brain,
    Save
} from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState<any>({ totalVisitors: 0, totalMessages: 0 });
    const [memories, setMemories] = useState<{ facts: any[], questions: any[] }>({ facts: [], questions: [] });
    const [answerInput, setAnswerInput] = useState<{ [key: string]: string }>({});
    const [factIndex, setFactIndex] = useState(0);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [copied, setCopied] = useState(false);

    // Knowledge Base State
    const [knowledgeBase, setKnowledgeBase] = useState("");
    const [isUpdatingKnowledge, setIsUpdatingKnowledge] = useState(false);

    const fetchMemories = async () => {
        try {
            const { data } = await api.get('/user/memories/pending');
            setMemories(data);
            localStorage.setItem('pendingMemories', JSON.stringify(data));
        } catch (e) {
            console.error("Failed memories fetch", e);
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        const cachedStats = localStorage.getItem('dashboardStats');
        const cachedMemories = localStorage.getItem('pendingMemories');

        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        // 1. Instant Load from Cache
        if (cachedStats) setStats(JSON.parse(cachedStats));
        if (cachedMemories) setMemories(JSON.parse(cachedMemories));

        if (token) {
            const loadData = () => {
                api.get('/user/dashboard-stats')
                    .then(({ data }) => {
                        setStats(data);
                        localStorage.setItem('dashboardStats', JSON.stringify(data));
                    })
                    .catch(err => console.error("Failed to load stats", err));

                fetchMemories();

                // Fetch current knowledge
                api.get('/user/me')
                    .then(res => {
                        if (res.data?.profile?.bio) {
                            setKnowledgeBase(res.data.profile.bio);
                        }
                    })
                    .catch(console.error);
            };

            loadData(); // Initial Fetch
            const interval = setInterval(loadData, 5000); // Poll every 5s

            return () => clearInterval(interval);
        }
    }, []);

    const handleQuickUpdateKnowledge = async () => {
        setIsUpdatingKnowledge(true);
        try {
            await api.put('/user/profile', { bio: knowledgeBase });
            toast.success("Ty for helping now improving your character knowledge", {
                icon: <Brain className="text-neon-purple" size={18} />,
                style: { background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(188,19,254,0.3)', color: 'white' }
            });
        } catch (error) {
            toast.error("Failed to update knowledge");
        } finally {
            setIsUpdatingKnowledge(false);
        }
    };

    const handleApproveFact = async (id: string) => {
        // Optimistic Update
        setMemories(prev => ({
            ...prev,
            facts: prev.facts.filter(f => f.id !== id)
        }));
        setFactIndex(0);
        toast.success("Fact approved");

        try {
            await api.post(`/user/memories/${id}/approve`, {});
            fetchMemories(); // Sync in background
        } catch (e) {
            toast.error("Failed to sync approval");
        }
    };

    const handleDeleteMemory = async (id: string, type: 'fact' | 'question') => {
        // Optimistic Update
        setMemories(prev => ({
            ...prev,
            facts: type === 'fact' ? prev.facts.filter(f => f.id !== id) : prev.facts,
            questions: type === 'question' ? prev.questions.filter(q => q.id !== id) : prev.questions
        }));

        if (type === 'fact') setFactIndex(0);
        else setQuestionIndex(0);
        toast.info("Memory discarded");

        try {
            await api.delete(`/user/memories/${id}`);
            fetchMemories(); // Sync
        } catch (e) {
            toast.error("Failed to delete");
        }
    };

    const handleAnswerQuestion = async (id: string) => {
        const answer = answerInput[id];
        if (!answer) return;

        // Optimistic Update
        setMemories(prev => ({
            ...prev,
            questions: prev.questions.filter(q => q.id !== id)
        }));
        setQuestionIndex(0);
        setAnswerInput(prev => ({ ...prev, [id]: "" }));
        toast.success("Question answered");

        try {
            await api.post(`/user/memories/${id}/approve`, { answer });
            fetchMemories(); // Sync
        } catch (e) {
            toast.error("Failed to sync answer");
        }
    };

    const profileUrl = user ? `${window.location.origin}/interact/${user.username}` : "";

    const copyLink = () => {
        navigator.clipboard.writeText(profileUrl);
        setCopied(true);
        toast.success("Link copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    // Helper to cycle carousel
    const nextItem = (type: 'fact' | 'question') => {
        if (type === 'fact') {
            setFactIndex(prev => (prev + 1) % memories.facts.length);
        } else {
            setQuestionIndex(prev => (prev + 1) % memories.questions.length);
        }
    };

    const currentFact = memories.facts[factIndex];
    const currentQuestion = memories.questions[questionIndex];

    return (
        <div className="min-h-screen w-full relative font-outfit overflow-x-hidden text-white bg-black">
            {/* Animated Background */}
            <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-black z-0"></div>
            <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none z-0"></div>

            {/* Grid Pattern */}
            <div className="fixed inset-0 bg-[linear-gradient(rgba(0,243,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0"></div>

            {/* Header */}
            <div className="relative z-20 p-6 flex items-center justify-between backdrop-blur-sm border-b border-white/5">
                <div className="flex items-center gap-3">
                    <Logo size="md" />
                    <div className="h-4 w-[1px] bg-white/10 mx-2"></div>
                    <span className="font-mono text-xs text-white/50 tracking-widest">DASHBOARD</span>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" className="text-white/70 hover:text-neon-cyan hover:bg-white/5" onClick={() => navigate("/settings")}>
                        <Settings size={18} />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-white/70 hover:text-red-400 hover:bg-white/5" onClick={handleLogout}>
                        <LogOut size={18} />
                    </Button>
                </div>
            </div>

            <div className="relative z-10 max-w-6xl mx-auto p-4 md:p-8 space-y-8">

                {/* Welcome & Stats Row */}
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="flex-1 space-y-2">
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            Welcome back, {user?.firstName}
                        </h1>
                        <p className="text-white/60">Here is what's happening with your digital twin.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <GlassCard className="p-6 flex items-center gap-4 hover:bg-white/5 transition-colors">
                            <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                                <Users size={24} />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{stats.totalVisitors.toLocaleString()}</div>
                                <div className="text-xs text-white/40 uppercase tracking-wider">Total Visitors</div>
                            </div>
                        </GlassCard>
                        <GlassCard className="p-6 flex items-center gap-4 hover:bg-white/5 transition-colors">
                            <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
                                <MessageSquare size={24} />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{stats.totalMessages.toLocaleString()}</div>
                                <div className="text-xs text-white/40 uppercase tracking-wider">Messages</div>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Deployment Hub */}
                    <GlassCard className="p-6 flex flex-col justify-center gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="text-xs text-green-500 font-mono">SYSTEM ONLINE</span>
                            </div>
                            <Button variant="ghost" size="sm" className="h-6 text-xs text-white/40 hover:text-white" onClick={() => navigate('/share')}>
                                <Share2 size={12} className="mr-1" /> Share
                            </Button>
                        </div>

                        <div className="flex gap-2">
                            <div className="flex-1 bg-black/40 rounded-lg px-3 py-2 border border-white/5 flex items-center">
                                <code className="flex-1 text-sm text-neon-cyan truncate font-mono bg-transparent">
                                    {profileUrl || "Generating..."}
                                </code>
                            </div>
                            <Button size="icon" variant="secondary" onClick={copyLink} className="shrink-0 bg-white/10 hover:bg-white/20 text-white">
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                            </Button>
                            <Button
                                size="icon"
                                className="shrink-0 bg-neon-cyan text-black hover:bg-neon-cyan/80"
                                asChild
                            >
                                <a href={profileUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink size={16} />
                                </a>
                            </Button>
                        </div>
                    </GlassCard>
                </div>



                {/* MEMORY MANAGEMENT SECTION (Carousel) */}
                {(memories.facts.length > 0 || memories.questions.length > 0) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid md:grid-cols-2 gap-6"
                    >
                        {/* New Facts Carousel */}
                        {memories.facts.length > 0 && currentFact && (
                            <GlassCard className="p-0 overflow-hidden border-white/10">
                                <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-neon-cyan/20 rounded-lg">
                                            <Zap size={18} className="text-neon-cyan" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">New Facts ({memories.facts.length})</h3>
                                        </div>
                                    </div>
                                    {memories.facts.length > 1 && (
                                        <Button variant="ghost" size="sm" onClick={() => nextItem('fact')} className="text-xs h-7">
                                            Skip <span className="ml-1 opacity-50">&rarr;</span>
                                        </Button>
                                    )}
                                </div>
                                <div className="p-6 min-h-[160px] flex flex-col justify-between">
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 mb-4">
                                        <p className="text-sm text-white/90 italic">"{currentFact.content}"</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button className="flex-1 bg-green-500/20 text-green-400 hover:bg-green-500/30" onClick={() => handleApproveFact(currentFact.id)}>
                                            <Check size={16} className="mr-2" /> Approve
                                        </Button>
                                        <Button className="flex-1 bg-red-500/20 text-red-400 hover:bg-red-500/30" onClick={() => handleDeleteMemory(currentFact.id, 'fact')}>
                                            <LogOut size={16} className="mr-2 rotate-180" /> Discard
                                        </Button>
                                    </div>
                                </div>
                            </GlassCard>
                        )}

                        {/* Visitor Questions Carousel */}
                        {memories.questions.length > 0 && currentQuestion && (
                            <GlassCard className="p-0 overflow-hidden border-white/10">
                                <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-neon-purple/20 rounded-lg">
                                            <MessageSquare size={18} className="text-neon-purple" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">Questions ({memories.questions.length})</h3>
                                        </div>
                                    </div>
                                    {memories.questions.length > 1 && (
                                        <Button variant="ghost" size="sm" onClick={() => nextItem('question')} className="text-xs h-7">
                                            Skip <span className="ml-1 opacity-50">&rarr;</span>
                                        </Button>
                                    )}
                                </div>
                                <div className="p-6 min-h-[160px] flex flex-col justify-between">
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 mb-4">
                                        <p className="text-sm font-medium text-neon-purple mb-2">Visitor asked:</p>
                                        <p className="text-sm text-white/90">"{currentQuestion.prompt}"</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-neon-purple/50 transition-colors"
                                            placeholder="Type answer..."
                                            value={answerInput[currentQuestion.id] || ""}
                                            onChange={(e) => setAnswerInput({ ...answerInput, [currentQuestion.id]: e.target.value })}
                                        />
                                        <Button size="sm" className="bg-neon-purple/20 text-neon-purple hover:bg-neon-purple/30" onClick={() => handleAnswerQuestion(currentQuestion.id)}>
                                            Teach
                                        </Button>
                                        <Button size="icon" variant="ghost" className="text-white/40 hover:text-red-400" onClick={() => handleDeleteMemory(currentQuestion.id, 'question')}>
                                            <LogOut size={14} className="rotate-180" />
                                        </Button>
                                    </div>
                                </div>
                            </GlassCard>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
