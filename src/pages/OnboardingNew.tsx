import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { GlassCard } from "@/components/GlassCard";
import { Avatar3D } from "@/components/Avatar3D";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Brain,
  Heart,
  Zap,
  MessageSquare,
  User,
  Smile,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { api } from "@/lib/api";

const OnboardingNew = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const [termsAccepted, setTermsAccepted] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    // Step 1: Basic Identity
    nickname: "",
    tagline: "",

    // Step 2: Communication Style
    formalityLevel: "balanced" as "casual" | "balanced" | "formal",
    humorStyle: "witty" as "playful" | "witty" | "serious",
    responseLength: "conversational" as "brief" | "detailed" | "conversational",

    // Step 3: Bio and Writing Style (NEW - replaces Q&A)
    bio: "", // Free-text biography
    writingStyle: "", // Sample of how they write

    // Step 4: Avatar
    gender: "neutral" as "male" | "female" | "neutral",
  });

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = async () => {
    if (step === 1 && !termsAccepted) return; // block if T&S not accepted
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Final step: Save all data
      try {
        await api.post('/user/onboarding', {
          interests: formData.tagline,
          personality: JSON.stringify({
            nickname: formData.nickname,
            tagline: formData.tagline,
            formalityLevel: formData.formalityLevel,
            humorStyle: formData.humorStyle,
            responseLength: formData.responseLength,
            bio: formData.bio,
            writingStyle: formData.writingStyle
          }),
          funFacts: formData.tagline,
          // New fields
          bio: formData.bio,
          writingStyle: formData.writingStyle
        });
        await api.post('/user/avatar', { gender: formData.gender });
        navigate("/avatar");
      } catch (e) {
        console.error("Failed to save", e);
        navigate("/avatar");
      }
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const styleOptions = {
    formality: [
      { value: "casual", label: "Casual", desc: "Relaxed and friendly 😊" },
      { value: "balanced", label: "Balanced", desc: "Mix of professional & friendly" },
      { value: "formal", label: "Formal", desc: "Professional and structured 🎩" }
    ],
    humor: [
      { value: "playful", label: "Playful", desc: "Fun and joking around 🎉" },
      { value: "witty", label: "Witty", desc: "Clever and intelligent humor 🧠" },
      { value: "serious", label: "Serious", desc: "Straight to the point 📌" }
    ],
    length: [
      { value: "brief", label: "Brief", desc: "Short & to the point" },
      { value: "detailed", label: "Detailed", desc: "Thorough explanations" },
      { value: "conversational", label: "Conversational", desc: "Natural back-and-forth" }
    ]
  };

  return (
    <div className="min-h-screen p-4 bg-grid relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
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

      {/* Header */}
      <div className="relative z-20 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <Logo size="md" />
          <div className="text-sm text-muted-foreground">
            Step {step} of {totalSteps}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-white/10 rounded-full mb-8 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple"
            initial={{ width: 0 }}
            animate={{ width: `${(step / totalSteps) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* STEP 1: Terms of Service */}
            {step === 1 && (
              <GlassCard className="p-5 md:p-8 mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <ShieldCheck className="text-neon-cyan" size={24} />
                  <h2 className="text-2xl font-bold">Terms of Service</h2>
                </div>

                {/* Scrollable T&S content */}
                <div className="h-[340px] overflow-y-auto pr-2 mb-6 space-y-5 text-sm text-white/70 leading-relaxed scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">

                  <div>
                    <h3 className="text-white font-semibold mb-2 flex items-center gap-2"><span className="text-neon-cyan">01.</span> What Norlava Does</h3>
                    <p>Norlava lets you create an AI digital twin — a conversational avatar that represents you and can interact with visitors on your behalf. By creating an account, you agree to let the platform use the information you provide to train and power your AI twin.</p>
                  </div>

                  <div>
                    <h3 className="text-white font-semibold mb-2 flex items-center gap-2"><span className="text-neon-cyan">02.</span> Your Data & AI Learning</h3>
                    <p>Your AI twin learns from conversations between visitors and your avatar. Any information <strong className="text-white">shared by visitors during chats</strong> — such as facts about you, preferences, or relationship context — may be stored and used to improve your twin's responses.</p>
                    <p className="mt-2">You can review, approve, or delete these learned facts at any time from your Dashboard.</p>
                  </div>

                  <div className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-4">
                    <h3 className="text-amber-400 font-semibold mb-2 flex items-center gap-2"><AlertTriangle size={16} /> Privacy Warning — Read Carefully</h3>
                    <p className="text-amber-200/80">Do <strong>NOT</strong> share sensitive, private, or confidential information through your profile or in conversations with your AI twin. This includes:</p>
                    <ul className="mt-2 space-y-1 list-disc list-inside text-amber-200/70">
                      <li>Passwords, PINs, or security credentials</li>
                      <li>Financial details (bank accounts, card numbers)</li>
                      <li>Medical records or sensitive health information</li>
                      <li>Private addresses or personal safety information</li>
                      <li>Third-party personal data without their consent</li>
                    </ul>
                    <p className="mt-3 text-amber-200/80">Your AI twin may discuss anything you teach it with any visitor. <strong className="text-amber-300">Only share what you are comfortable making public.</strong></p>
                  </div>

                  <div>
                    <h3 className="text-white font-semibold mb-2 flex items-center gap-2"><span className="text-neon-cyan">03.</span> Your Responsibilities</h3>
                    <ul className="space-y-2 list-disc list-inside">
                      <li>You are responsible for the accuracy of the information you provide.</li>
                      <li>You must not use Norlava to impersonate another real person without their consent.</li>
                      <li>You must not use the platform to spread misinformation, hate speech, or harmful content.</li>
                      <li>You agree to keep your account credentials secure.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-white font-semibold mb-2 flex items-center gap-2"><span className="text-neon-cyan">04.</span> Data Retention & Deletion</h3>
                    <p>You may delete your account and all associated data at any time from your account settings. Upon deletion, your AI twin, conversation history, and learned facts will be permanently removed.</p>
                  </div>

                  <div>
                    <h3 className="text-white font-semibold mb-2 flex items-center gap-2"><span className="text-neon-cyan">05.</span> Changes to These Terms</h3>
                    <p>Norlava reserves the right to update these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms. We will notify you of significant changes.</p>
                  </div>

                  <div className="text-white/40 text-xs">
                    Last updated: February 2026 · Effective immediately upon account creation.
                  </div>
                </div>

                {/* Acceptance checkbox */}
                <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${termsAccepted
                    ? 'border-neon-cyan bg-neon-cyan/10'
                    : 'border-white/10 hover:border-white/20'
                  }`}>
                  <input
                    type="checkbox"
                    className="mt-0.5 w-4 h-4 accent-cyan-400 shrink-0"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                  />
                  <span className="text-sm text-white/80 leading-relaxed">
                    I have read and agree to the <strong className="text-white">Terms of Service</strong>. I understand that information I share may be discussed by my AI twin with visitors, and I will not share sensitive or private data through this platform.
                  </span>
                </label>

                {!termsAccepted && (
                  <p className="text-xs text-white/30 mt-3 text-center">Please accept the terms above to continue.</p>
                )}
              </GlassCard>
            )}

            {/* STEP 2: Identity */}
            {step === 2 && (
              <GlassCard className="p-5 md:p-8 mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <User className="text-neon-cyan" />
                  <h2 className="text-2xl font-bold">Who Are You?</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Your Nickname</label>
                    <Input
                      placeholder="e.g., Alex, ChatMaster, etc."
                      value={formData.nickname}
                      onChange={(e) => updateField("nickname", e.target.value)}
                      className="bg-white/5 border-white/10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Your Tagline</label>
                    <Input
                      placeholder="e.g., Entrepreneur | Designer | Coffee enthusiast"
                      value={formData.tagline}
                      onChange={(e) => updateField("tagline", e.target.value)}
                      className="bg-white/5 border-white/10"
                    />
                  </div>

                  <p className="text-sm text-muted-foreground">This helps your AI twin introduce itself to visitors.</p>
                </div>
              </GlassCard>
            )}

            {/* STEP 3: Communication Style */}
            {step === 3 && (
              <div className="space-y-6">
                <GlassCard className="p-5 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Sparkles className="text-neon-cyan" />
                    <h2 className="text-2xl font-bold">How Do You Communicate?</h2>
                  </div>

                  {/* Formality */}
                  <div className="mb-8">
                    <label className="block text-sm font-medium mb-4 text-foreground/80">Tone</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {styleOptions.formality.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => updateField("formalityLevel", opt.value)}
                          className={`p-6 rounded-xl border-2 transition-all text-left flex flex-col gap-2 h-full ${formData.formalityLevel === opt.value
                            ? "border-neon-cyan bg-neon-cyan/10 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                            : "border-white/10 hover:border-white/20 hover:bg-white/5"
                            }`}
                        >
                          <div className="font-semibold text-lg">{opt.label}</div>
                          <div className="text-sm text-muted-foreground leading-relaxed">{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Humor */}
                  <div className="mb-8">
                    <label className="block text-sm font-medium mb-4 text-foreground/80">Humor Style</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {styleOptions.humor.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => updateField("humorStyle", opt.value)}
                          className={`p-6 rounded-xl border-2 transition-all text-left flex flex-col gap-2 h-full ${formData.humorStyle === opt.value
                            ? "border-neon-cyan bg-neon-cyan/10 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                            : "border-white/10 hover:border-white/20 hover:bg-white/5"
                            }`}
                        >
                          <div className="font-semibold text-lg">{opt.label}</div>
                          <div className="text-sm text-muted-foreground leading-relaxed">{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Response Length */}
                  <div>
                    <label className="block text-sm font-medium mb-4 text-foreground/80">Response Length</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {styleOptions.length.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => updateField("responseLength", opt.value)}
                          className={`p-6 rounded-xl border-2 transition-all text-left flex flex-col gap-2 h-full ${formData.responseLength === opt.value
                            ? "border-neon-cyan bg-neon-cyan/10 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                            : "border-white/10 hover:border-white/20 hover:bg-white/5"
                            }`}
                        >
                          <div className="font-semibold text-lg">{opt.label}</div>
                          <div className="text-sm text-muted-foreground leading-relaxed">{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              </div>
            )}

            {/* STEP 4: Bio & Writing Style */}
            {step === 4 && (
              <div className="space-y-6">
                <GlassCard className="p-5 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Brain className="text-neon-cyan" />
                    <h2 className="text-2xl font-bold">Tell Me About Yourself</h2>
                  </div>

                  <p className="text-sm text-muted-foreground mb-6">
                    Write freely about who you are, what you do, your passions, and interesting things about yourself. This is what visitors will see and learn from!
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Your Bio</label>
                      <Textarea
                        placeholder="Tell us everything! Your background, passions, expertise, what you do for fun, your values... Be authentic!"
                        value={formData.bio}
                        onChange={(e) => updateField("bio", e.target.value)}
                        className="bg-white/5 border-white/10 min-h-[150px]"
                      />
                      <div className="text-xs text-muted-foreground mt-2">{formData.bio.length}/1000 characters</div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">How You Write</label>
                      <Textarea
                        placeholder="Share a sample of how you naturally write. This helps your AI twin sound exactly like you! (e.g., a paragraph from an article, email, or social media post)"
                        value={formData.writingStyle}
                        onChange={(e) => updateField("writingStyle", e.target.value)}
                        className="bg-white/5 border-white/10 min-h-[100px]"
                      />
                      <div className="text-xs text-muted-foreground mt-2">Tip: Copy-paste something you wrote naturally</div>
                    </div>
                  </div>
                </GlassCard>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between gap-4 mb-8 mt-8">
          <Button
            variant="glass"
            onClick={handleBack}
            disabled={step === 1}
            className="gap-2"
          >
            <ArrowLeft size={18} />
            Back
          </Button>

          <Button
            variant="neon"
            onClick={handleNext}
            className="gap-2"
            disabled={step === 1 && !termsAccepted}
          >
            {step === totalSteps ? "Complete" : "Next"}
            <ArrowRight size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingNew;
