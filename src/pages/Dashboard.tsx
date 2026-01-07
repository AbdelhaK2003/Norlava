import axios from "axios";
import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { GlassCard } from "@/components/GlassCard";
import { Avatar3D } from "@/components/Avatar3D";
import { Button } from "@/components/ui/button";
import {
    Users,
    MessageSquare,
    TrendingUp,
    Share2,
    Settings,
    ExternalLink,
    Copy,
    BarChart3,
    Clock,
    HelpCircle,
    LogOut,
    Brain,
    Check,
    X
} from "lucide-react";

// Mock data removed. Real stats fetched from backend.

const Dashboard = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState<any>({ totalVisitors: 0, totalMessages: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [memories, setMemories] = useState<{ facts: any[], questions: any[] }>({ facts: [], questions: [] });
    const [answerInput, setAnswerInput] = useState<{ [key: string]: string }>({});
    const [copied, setCopied] = useState(false);

    const fetchMemories = async () => {
        try {
            const { data } = await api.get('/user/memories/pending');
            setMemories(data);
        } catch (e) {
            console.error("Failed memories fetch", e);
        }
    };

    const [error, setError] = useState<string | null>(null);

    const fetchStats = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data } = await api.get('/user/dashboard-stats');
            setStats(data);
        } catch (err: any) {
            console.error("Failed to fetch stats", err);
            setError(err.message || "Failed to load stats");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Get user from localStorage
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        if (token) {
            fetchStats();
            fetchMemories();
        }
    }, []);

    const handleApproveFact = async (id: string) => {
        await api.post(`/user/memories/${id}/approve`, {});
        fetchMemories();
    };

    const handleDeleteMemory = async (id: string) => {
        await api.delete(`/user/memories/${id}`);
        fetchMemories();
    };

    const handleAnswerQuestion = async (id: string) => {
        const answer = answerInput[id];
        if (!answer) return;
        await api.post(`/user/memories/${id}/approve`, { answer });
        fetchMemories();
    };

    const profileUrl = user ? `${window.location.origin}/interact/${user.username}` : "";

    const copyLink = () => {
        navigator.clipboard.writeText(profileUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const statCards = [
        {
            title: t('dashboard.visitors'),
            value: stats.totalVisitors.toLocaleString(),
            icon: Users,
            color: "from-blue-500 to-cyan-500",
            change: "Live"
        },
        {
            title: t('dashboard.messages'),
            value: stats.totalMessages.toLocaleString(),
            icon: MessageSquare,
            color: "from-purple-500 to-pink-500",
            change: "Total"
        }
    ];

    return (
        <div className="min-h-screen bg-grid p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center gap-4">
                        <Logo size="sm" />
                        <div>
                            <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>
                            <p className="text-muted-foreground">{t('dashboard.welcome')}, {user?.firstName || "User"}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/onboarding")}>
                            <Settings size={16} />
                            <span className="hidden md:inline">{t('dashboard.settings')}</span>
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2" onClick={handleLogout}>
                            <LogOut size={16} />
                            <span className="hidden md:inline">{t('dashboard.logout')}</span>
                        </Button>
                    </div>
                </motion.div>

                {/* Profile Card */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <GlassCard className="p-6" glow>
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <Avatar3D size="lg" />
                            <div className="flex-1 text-center md:text-left">
                                <h2 className="text-xl font-bold">Your AI Avatar</h2>
                                <p className="text-muted-foreground mb-3">Share your profile with others</p>
                                <div className="flex flex-col sm:flex-row items-center gap-3">
                                    <div className="flex-1 bg-muted/50 rounded-lg px-4 py-2 text-sm font-mono truncate max-w-md">
                                        {profileUrl || "Loading..."}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="gap-2" onClick={copyLink}>
                                            {copied ? t('dashboard.copied') : <><Copy size={16} /> {t('dashboard.copyLink')}</>}
                                        </Button>
                                        <Button variant="neon" size="sm" className="gap-2" asChild>
                                            <Link to={user ? `/interact/${user.username}` : "#"}>
                                                <ExternalLink size={16} /> View Live
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    {statCards.map((stat, index) => (
                        <motion.div
                            key={stat.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + index * 0.1 }}
                        >
                            <GlassCard className="p-4 md:p-6">
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                                        <stat.icon size={20} className="text-white" />
                                    </div>
                                    <span className="text-xs text-green-500 font-medium">{stat.change}</span>
                                </div>
                                <div className="text-2xl md:text-3xl font-bold mb-1">{stat.value}</div>
                                <div className="text-sm text-muted-foreground">{stat.title}</div>
                            </GlassCard>
                        </motion.div>
                    ))}
                </div>

            </div>

            {/* Memory Management Section (New Findings) */}
            {(memories.facts.length > 0 || memories.questions.length > 0) && (
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Learned Facts */}
                        {memories.facts.length > 0 && (
                            <GlassCard className="p-6 h-full">
                                <div className="flex items-center gap-2 mb-4">
                                    <Brain size={20} className="text-primary" />
                                    <h3 className="text-lg font-semibold">New Facts Learned</h3>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Your AI picked up these new details about you. Keep or discard?
                                </p>
                                <div className="space-y-3">
                                    {memories.facts.map((fact) => (
                                        <div key={fact.id} className="bg-muted/30 p-3 rounded-lg flex items-start justify-between gap-3">
                                            <p className="text-sm flex-1">"{fact.content}"</p>
                                            <div className="flex gap-2">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500 hover:text-green-400 hover:bg-green-500/20" onClick={() => handleApproveFact(fact.id)}>
                                                    <Check size={16} />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/20" onClick={() => handleDeleteMemory(fact.id)}>
                                                    <X size={16} />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </GlassCard>
                        )}

                        {/* Visitor Questions */}
                        {memories.questions.length > 0 && (
                            <GlassCard className="p-6 h-full">
                                <div className="flex items-center gap-2 mb-4">
                                    <HelpCircle size={20} className="text-secondary" />
                                    <h3 className="text-lg font-semibold">Visitor Questions</h3>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Visitors asked these questions. Teach your AI the answer.
                                </p>
                                <div className="space-y-4">
                                    {memories.questions.map((q) => (
                                        <div key={q.id} className="bg-muted/30 p-3 rounded-lg space-y-3">
                                            <div className="flex justify-between items-start gap-2">
                                                <p className="text-sm font-medium text-secondary">Q: {q.prompt}</p>
                                                <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteMemory(q.id)}>
                                                    <X size={14} />
                                                </Button>
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    className="flex-1 bg-background/50 border border-input rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                                    placeholder="Type your answer..."
                                                    value={answerInput[q.id] || ""}
                                                    onChange={(e) => setAnswerInput({ ...answerInput, [q.id]: e.target.value })}
                                                />
                                                <Button size="sm" variant="secondary" onClick={() => handleAnswerQuestion(q.id)}>
                                                    Answer
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </GlassCard>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Share Section */}
            <motion.div
                className="mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
            >
                <GlassCard className="p-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Share2 size={24} className="text-primary" />
                            <div>
                                <h3 className="font-semibold">Share Your Avatar</h3>
                                <p className="text-sm text-muted-foreground">Let others interact with your AI</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="gap-2">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                                </svg>
                                Twitter
                            </Button>
                            <Button variant="outline" className="gap-2">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                </svg>
                                LinkedIn
                            </Button>
                            <Button variant="neon" className="gap-2" onClick={copyLink}>
                                <Copy size={16} />
                                {copied ? "Copied!" : "Copy Link"}
                            </Button>
                        </div>
                    </div>
                </GlassCard>
            </motion.div>
        </div>
    );
};

export default Dashboard;
