import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertTriangle, ArrowLeft } from "lucide-react";

const TermsOfService = () => {
    return (
        <div className="min-h-screen p-4 md:p-8 bg-grid relative overflow-hidden font-outfit text-white">
            {/* Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute w-[500px] h-[500px] bg-neon-cyan/5 rounded-full blur-3xl"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 8, repeat: Infinity }}
                    style={{ bottom: "-10%", left: "-10%" }}
                />
                <motion.div
                    className="absolute w-[500px] h-[500px] bg-neon-purple/5 rounded-full blur-3xl"
                    animate={{ scale: [1.2, 1, 1.2] }}
                    transition={{ duration: 8, repeat: Infinity }}
                    style={{ top: "-10%", right: "-10%" }}
                />
            </div>

            <div className="relative z-10 max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <Logo size="md" />
                    <Link to="/register">
                        <Button variant="ghost" className="gap-2 text-white/60 hover:text-white">
                            <ArrowLeft size={16} /> Back to Register
                        </Button>
                    </Link>
                </div>

                {/* Title */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <ShieldCheck className="text-neon-cyan" size={32} />
                        <h1 className="text-4xl font-bold">Terms of Service</h1>
                    </div>
                    <p className="text-white/50 text-sm">Last updated: February 2026 · Effective immediately upon account creation.</p>
                </motion.div>

                <GlassCard className="p-6 md:p-10 space-y-8 text-sm text-white/70 leading-relaxed">

                    {/* Section 01 */}
                    <div>
                        <h2 className="text-white text-lg font-semibold mb-3 flex items-center gap-2">
                            <span className="text-neon-cyan font-mono">01.</span> What Norlava Does
                        </h2>
                        <p>
                            Norlava lets you create an <strong className="text-white">AI digital twin</strong> — a conversational avatar
                            that represents you and can interact with visitors on your behalf. By creating an account, you agree to let
                            the platform use the information you provide to train and power your AI twin.
                        </p>
                    </div>

                    {/* Section 02 */}
                    <div>
                        <h2 className="text-white text-lg font-semibold mb-3 flex items-center gap-2">
                            <span className="text-neon-cyan font-mono">02.</span> Your Data & AI Learning
                        </h2>
                        <p>
                            Your AI twin learns from conversations between visitors and your avatar. Any information{" "}
                            <strong className="text-white">shared by visitors during chats</strong> — such as facts about you,
                            preferences, or relationship context — may be stored and used to improve your twin's responses.
                        </p>
                        <p className="mt-3">
                            You can review, approve, or delete these learned facts at any time from your Dashboard.
                        </p>
                    </div>

                    {/* Privacy Warning */}
                    <div className="border border-amber-500/30 bg-amber-500/5 rounded-2xl p-6">
                        <h2 className="text-amber-400 text-lg font-semibold mb-3 flex items-center gap-2">
                            <AlertTriangle size={20} /> Privacy Warning — Read Carefully
                        </h2>
                        <p className="text-amber-200/80 mb-4">
                            Do <strong className="text-amber-300">NOT</strong> share sensitive, private, or confidential information
                            through your profile or in conversations with your AI twin. This includes:
                        </p>
                        <ul className="space-y-2 list-disc list-inside text-amber-200/70">
                            <li>Passwords, PINs, or security credentials</li>
                            <li>Financial details (bank accounts, card numbers, crypto keys)</li>
                            <li>Medical records or sensitive health information</li>
                            <li>Private home addresses or personal safety information</li>
                            <li>Third-party personal data without their explicit consent</li>
                            <li>Legal or confidential business information</li>
                        </ul>
                        <p className="mt-4 text-amber-300 font-medium">
                            ⚠️ Your AI twin may discuss anything you teach it with ANY visitor. Only share what you are fully
                            comfortable making public.
                        </p>
                    </div>

                    {/* Section 03 */}
                    <div>
                        <h2 className="text-white text-lg font-semibold mb-3 flex items-center gap-2">
                            <span className="text-neon-cyan font-mono">03.</span> Your Responsibilities
                        </h2>
                        <ul className="space-y-2 list-disc list-inside">
                            <li>You are responsible for the accuracy of all information you provide.</li>
                            <li>You must not use Norlava to impersonate another real person without their explicit consent.</li>
                            <li>You must not use the platform to spread misinformation, hate speech, or harmful content.</li>
                            <li>You agree to keep your account credentials private and secure.</li>
                            <li>You are solely responsible for what you teach your AI twin.</li>
                        </ul>
                    </div>

                    {/* Section 04 */}
                    <div>
                        <h2 className="text-white text-lg font-semibold mb-3 flex items-center gap-2">
                            <span className="text-neon-cyan font-mono">04.</span> Data Retention & Deletion
                        </h2>
                        <p>
                            You may delete your account and all associated data at any time from your account settings. Upon deletion,
                            your AI twin, conversation history, learned facts, and personal data will be permanently removed from our
                            systems within 30 days.
                        </p>
                    </div>

                    {/* Section 05 */}
                    <div>
                        <h2 className="text-white text-lg font-semibold mb-3 flex items-center gap-2">
                            <span className="text-neon-cyan font-mono">05.</span> Limitation of Liability
                        </h2>
                        <p>
                            Norlava is provided "as is." We are not liable for any damages arising from use of the platform, misuse of
                            your AI twin by visitors, or information disclosed through your avatar. You use this service at your own risk.
                        </p>
                    </div>

                    {/* Section 06 */}
                    <div>
                        <h2 className="text-white text-lg font-semibold mb-3 flex items-center gap-2">
                            <span className="text-neon-cyan font-mono">06.</span> Changes to These Terms
                        </h2>
                        <p>
                            Norlava reserves the right to update these terms at any time. Continued use of the platform after changes
                            constitutes acceptance of the new terms. We will notify registered users of significant changes via email.
                        </p>
                    </div>

                    {/* CTA */}
                    <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <p className="text-white/40 text-xs">By creating an account, you accept these terms in full.</p>
                        <Link to="/register">
                            <Button variant="neon" className="gap-2">
                                Back to Register <ArrowLeft size={16} className="rotate-180" />
                            </Button>
                        </Link>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};

export default TermsOfService;
