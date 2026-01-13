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
} from "lucide-react";
import { api } from "@/lib/api";

const OnboardingNew = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const totalSteps = 4;
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
            {/* STEP 1: Identity */}
            {step === 1 && (
              <GlassCard className="p-8 mb-8">
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

            {/* STEP 2: Communication Style */}
            {step === 2 && (
              <div className="space-y-6">
                <GlassCard className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Sparkles className="text-neon-cyan" />
                    <h2 className="text-2xl font-bold">How Do You Communicate?</h2>
                  </div>

                  {/* Formality */}
                  <div className="mb-8">
                    <label className="block text-sm font-medium mb-4">Tone</label>
                    <div className="grid grid-cols-3 gap-3">
                      {styleOptions.formality.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => updateField("formalityLevel", opt.value)}
                          className={`p-4 rounded-lg border-2 transition-all text-left ${
                            formData.formalityLevel === opt.value
                              ? "border-neon-cyan bg-neon-cyan/10"
                              : "border-white/10 hover:border-white/20"
                          }`}
                        >
                          <div className="font-medium text-sm">{opt.label}</div>
                          <div className="text-xs text-muted-foreground">{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Humor */}
                  <div className="mb-8">
                    <label className="block text-sm font-medium mb-4">Humor Style</label>
                    <div className="grid grid-cols-3 gap-3">
                      {styleOptions.humor.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => updateField("humorStyle", opt.value)}
                          className={`p-4 rounded-lg border-2 transition-all text-left ${
                            formData.humorStyle === opt.value
                              ? "border-neon-cyan bg-neon-cyan/10"
                              : "border-white/10 hover:border-white/20"
                          }`}
                        >
                          <div className="font-medium text-sm">{opt.label}</div>
                          <div className="text-xs text-muted-foreground">{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Response Length */}
                  <div>
                    <label className="block text-sm font-medium mb-4">Response Length</label>
                    <div className="grid grid-cols-3 gap-3">
                      {styleOptions.length.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => updateField("responseLength", opt.value)}
                          className={`p-4 rounded-lg border-2 transition-all text-left ${
                            formData.responseLength === opt.value
                              ? "border-neon-cyan bg-neon-cyan/10"
                              : "border-white/10 hover:border-white/20"
                          }`}
                        >
                          <div className="font-medium text-sm">{opt.label}</div>
                          <div className="text-xs text-muted-foreground">{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              </div>
            )}

            {/* STEP 3: Bio & Writing Style (NEW) */}
            {step === 3 && (
              <div className="space-y-6">
                <GlassCard className="p-8">
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

            {/* STEP 4: Avatar */}
            {step === 4 && (
              <GlassCard className="p-8 mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <Smile className="text-neon-cyan" />
                  <h2 className="text-2xl font-bold">Choose Your Avatar</h2>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  {["male", "female", "neutral"].map((g) => (
                    <button
                      key={g}
                      onClick={() => updateField("gender", g as any)}
                      className={`p-6 rounded-lg border-2 transition-all ${
                        formData.gender === g
                          ? "border-neon-cyan bg-neon-cyan/10"
                          : "border-white/10 hover:border-white/20"
                      }`}
                    >
                      <Avatar3D gender={g as "male" | "female" | "neutral"} />
                      <div className="text-sm font-medium mt-2 capitalize">{g}</div>
                    </button>
                  ))}
                </div>

                <p className="text-sm text-muted-foreground">You can change this anytime in settings!</p>
              </GlassCard>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between gap-4 mb-8">
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
