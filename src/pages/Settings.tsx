import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/GlassCard";
import { Logo } from "@/components/Logo";
import {
    ArrowLeft,
    Shield,
    Bot,
    Save,
    Lock
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Settings = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    // Password state
    const [passwordData, setPasswordData] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    // Knowledge state
    const [knowledge, setKnowledge] = useState("");

    // Load initial data
    useState(() => {
        api.get('/user/me').then(res => {
            if (res.data?.profile?.bio) {
                setKnowledge(res.data.profile.bio);
            }
        }).catch(console.error);
    });

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error(t('settings.passwordMismatch') || "New passwords do not match");
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast.error(t('settings.passwordLength') || "Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);
        try {
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;

            if (!user?.email) {
                toast.error("User session invalid");
                return;
            }

            await api.post('/auth/change-password', {
                email: user.email,
                oldPassword: passwordData.oldPassword,
                newPassword: passwordData.newPassword
            });

            toast.success(t('settings.passwordSuccess') || "Password updated successfully");
            setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || "Failed to update password");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateKnowledge = async () => {
        setIsLoading(true);
        try {
            await api.put('/user/profile', {
                bio: knowledge
            });
            toast.success("Knowledge base updated successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update knowledge base");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-grid p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-primary" onClick={() => navigate('/dashboard')}>
                        <ArrowLeft size={18} /> {t('common.backToDashboard') || "Back to Dashboard"}
                    </Button>
                    <div className="flex items-center gap-3 mt-4">
                        <Logo size="md" />
                        <h1 className="text-2xl font-bold">{t('settings.title') || "Settings"}</h1>
                    </div>
                </div>

                <Tabs defaultValue="security" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10 mb-8 max-w-md">
                        <TabsTrigger value="security" className="data-[state=active]:bg-neon-cyan/20 data-[state=active]:text-neon-cyan">
                            <Shield size={16} className="mr-2" />
                            Security
                        </TabsTrigger>
                        <TabsTrigger value="ai" className="data-[state=active]:bg-neon-purple/20 data-[state=active]:text-neon-purple">
                            <Bot size={16} className="mr-2" />
                            Knowledge Base
                        </TabsTrigger>
                    </TabsList>

                    {/* SECURITY TAB */}
                    <TabsContent value="security">
                        <GlassCard className="p-6 md:p-8 max-w-lg">
                            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                                <Lock size={20} className="text-neon-cyan" />
                                {t('settings.changePassword') || "Change Password"}
                            </h2>
                            <p className="text-sm text-muted-foreground mb-6">
                                Update your password securely. You must enter your current password.
                            </p>

                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Current Password</label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        value={passwordData.oldPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">New Password</label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Confirm New Password</label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        required
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    variant="neon"
                                    className="w-full mt-4"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Updating..." : (
                                        <>
                                            <Save size={16} className="mr-2" />
                                            Update Password
                                        </>
                                    )}
                                </Button>
                            </form>
                        </GlassCard>
                    </TabsContent>

                    {/* KNOWLEDGE BASE TAB */}
                    <TabsContent value="ai">
                        <GlassCard className="p-6 md:p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-semibold flex items-center gap-2">
                                        <Bot size={20} className="text-neon-purple" />
                                        Update AI Knowledge
                                    </h2>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Add information about yourself, your ideas, or your history. This is your Digital Twin's "Brain".
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/80">
                                        My Bio & Knowledge Dump
                                    </label>
                                    <textarea
                                        className="w-full min-h-[300px] p-4 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-neon-purple/50 resize-y font-mono text-sm leading-relaxed"
                                        placeholder="I was born in... My favorite philosophy is... I believe that..."
                                        value={knowledge}
                                        onChange={(e) => setKnowledge(e.target.value)}
                                    />
                                    <p className="text-xs text-white/40">
                                        Tip: Write in the first person ("I am...") or naturally. The AI will internalize this as its own memory.
                                    </p>
                                </div>

                                <div className="flex justify-end">
                                    <Button
                                        onClick={handleUpdateKnowledge}
                                        className="bg-neon-purple hover:bg-neon-purple/80 text-white min-w-[150px]"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Saving..." : (
                                            <>
                                                <Save size={18} className="mr-2" /> Save Knowledge
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </GlassCard>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default Settings;
