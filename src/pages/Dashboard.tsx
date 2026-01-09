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
    Share2,
    Settings,
    MapPin,
    Copy,
    Bot,
    LogOut,
    Check,
    Zap,
    ExternalLink
} from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState<any>({ totalVisitors: 0, totalMessages: 0 });
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        if (token) {
            api.get('/user/dashboard-stats')
                .then(({ data }) => setStats(data))
                .catch(err => console.error("Failed to load stats", err));
        }
    }, []);

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

    return (
        <div className="min-h-screen w-full relative font-outfit overflow-x-hidden text-white">
            {/* Global Background (Matching Interact.tsx) */}
            <div className="absolute inset-0 bg-black">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-cyan/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-[100px]"></div>
            </div>

            {/* Header */}
            <div className="relative z-20 p-6 flex items-center justify-between backdrop-blur-sm border-b border-white/5">
                <div className="flex items-center gap-3">
                    <Logo size="sm" />
                    <div className="h-4 w-[1px] bg-white/10 mx-2"></div>
                    <span className="font-mono text-xs text-white/50 tracking-widest">DASHBOARD v2.0</span>
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

            <div className="relative z-10 max-w-6xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* HERO SECTION (Avatar + Training) - Spans 7 columns */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-md p-8 min-h-[400px] flex flex-col items-center justify-center text-center group"
                    >
                        {/* Decorative Rings */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                            <div className="w-[300px] h-[300px] border border-neon-cyan/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
                            <div className="w-[400px] h-[400px] border border-neon-purple/30 rounded-full absolute animate-[spin_15s_linear_infinite_reverse]"></div>
                        </div>

                        <div className="relative z-10 scale-125 mb-8">
                            <Avatar3D size="xl" />
                        </div>

                        <h2 className="text-3xl font-bold mb-2 tracking-tight">
                            Ready to learn, <span className="text-neon-cyan">{user?.firstName}</span>?
                        </h2>
                        <p className="text-white/60 max-w-md mb-8">
                            Enter training mode to update my knowledge base through natural conversation.
                        </p>

                        <Button
                            onClick={() => user?.username && (window.location.href = `/interact/${user.username}`)}
                            className="bg-neon-cyan text-black hover:bg-white hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,243,255,0.4)] px-8 py-6 rounded-full text-lg font-bold tracking-wide gap-3"
                        >
                            <Zap size={20} className="fill-black" />
                            ENTER TRAINING MODE
                        </Button>
                    </motion.div>

                    {/* Quick Stats Row */}
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
                                <div className="text-xs text-white/40 uppercase tracking-wider">Messages Exchanged</div>
                            </div>
                        </GlassCard>
                    </div>
                </div>

                {/* SIDEBAR (Share & Control) - Spans 5 columns */}
                <div className="lg:col-span-5 flex flex-col gap-6">

                    {/* Share Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6 space-y-6"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <Share2 size={20} className="text-neon-purple" />
                            <h3 className="font-semibold text-lg">Deployment Hub</h3>
                        </div>

                        <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                            <label className="text-xs text-white/40 font-mono mb-2 block">PUBLIC PROFILE LINK</label>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 text-sm text-neon-cyan truncate font-mono bg-transparent">
                                    {profileUrl || "Generating..."}
                                </code>
                                <Button size="icon" variant="ghost" onClick={copyLink} className="hover:text-neon-cyan hover:bg-white/10">
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="outline" className="border-white/10 hover:bg-white/5 gap-2" onClick={() => navigate('/share')}>
                                <Share2 size={16} /> Share
                            </Button>
                            <Button
                                className="bg-white/10 hover:bg-white/20 text-white gap-2"
                                asChild
                            >
                                <a href={profileUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink size={16} /> View Live
                                </a>
                            </Button>
                        </div>
                    </motion.div>

                    {/* Pending Memories (Mini) */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex-1 rounded-3xl border border-white/10 bg-white/5 p-6 flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <Bot size={20} className="text-green-400" />
                                <h3 className="font-semibold text-lg">System Status</h3>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="text-xs text-green-500 font-mono">ONLINE</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                                <span className="text-sm text-white/70">Memory Core</span>
                                <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded">ACTIVE</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                                <span className="text-sm text-white/70">Voice Synthesis</span>
                                <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded">READY</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                                <span className="text-sm text-white/70">Response Engines</span>
                                <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded">OPTIMIZED</span>
                            </div>
                        </div>

                        <div className="mt-auto pt-6">
                            <Button variant="ghost" className="w-full text-xs text-white/40 hover:text-white font-mono" onClick={() => navigate("/settings")}>
                                CONFIGURE SYSTEM PARAMETERS &rarr;
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
