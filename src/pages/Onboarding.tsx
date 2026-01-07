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
  Plus,
  X,
  Mic,
  FileText
} from "lucide-react";
import { api } from "@/lib/api";

interface SampleQA {
  question: string;
  answer: string;
}

const Onboarding = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  const [formData, setFormData] = useState({
    // Step 1: Basic Identity
    nickname: "",
    tagline: "",

    // Step 2: Communication Style
    formalityLevel: "balanced" as "casual" | "balanced" | "formal",
    humorStyle: "witty" as "playful" | "witty" | "serious",
    responseLength: "conversational" as "brief" | "detailed" | "conversational",

    // Step 3: Expertise & Interests
    expertise: [] as string[],
    hobbies: [] as string[],

    // Step 4: Sample Responses
    sampleQA: [] as SampleQA[],

    // Step 5: Avatar
    gender: "neutral" as "male" | "female" | "neutral",
  });

  /* Separate temp inputs for Step 3 */
  const [expertInput, setExpertInput] = useState("");
  const [hobbyInput, setHobbyInput] = useState("");

  const [tempQA, setTempQA] = useState({ question: "", answer: "" });

  const navigate = useNavigate();

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addToArray = (field: "expertise" | "hobbies", value: string) => {
    if (value.trim() && !formData[field].includes(value.trim())) {
      updateField(field, [...formData[field], value.trim()]);
    }
    // Clear the correct input
    if (field === "expertise") setExpertInput("");
    if (field === "hobbies") setHobbyInput("");
  };

  const removeFromArray = (field: "expertise" | "hobbies", value: string) => {
    updateField(field, formData[field].filter((item) => item !== value));
  };

  const addSampleQA = () => {
    if (tempQA.question.trim() && tempQA.answer.trim()) {
      updateField("sampleQA", [...formData.sampleQA, { ...tempQA }]);
      setTempQA({ question: "", answer: "" });
    }
  };

  const removeSampleQA = (index: number) => {
    updateField("sampleQA", formData.sampleQA.filter((_, i) => i !== index));
  };

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Final step: Save all data
      try {
        await api.post('/user/onboarding', {
          interests: formData.expertise.join(", "),
          personality: JSON.stringify({
            nickname: formData.nickname,
            tagline: formData.tagline,
            formalityLevel: formData.formalityLevel,
            humorStyle: formData.humorStyle,
            responseLength: formData.responseLength,
            hobbies: formData.hobbies,
            sampleQA: formData.sampleQA
          }),
          funFacts: formData.hobbies.join(", ")
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

  /* VOICE MODE STATES */
  const [onboardingMode, setOnboardingMode] = useState<"manual" | "voice" | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [voiceFile, setVoiceFile] = useState<Blob | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/mp3' });
        setVoiceFile(blob);
        processVoice(blob);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error("Mic Error:", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      // Stop all tracks to release mic
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  };

  const processVoice = async (blob: Blob) => {
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'onboarding.mp3');

      const { data } = await api.post('/voice/clone-and-analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Populate form with AI analysis
      setFormData(prev => ({
        ...prev,
        nickname: data.analysis.bio.split(' ')[0] || "User", // Simple heuristic
        tagline: data.analysis.bio.substring(0, 50) + "...",
        expertise: data.analysis.interests || [],
        hobbies: data.analysis.funFacts || [],
        formalityLevel: "casual", // Default for voice users
        responseLength: "conversational"
      }));

      // Skip to Avatar step as data is saved to DB already
      // But we update local state to reflect it in UI if they go back
      setStep(5);
    } catch (e) {
      console.error("Voice Processing Failed", e);
      alert("Failed to analyze voice. Please try again or use manual mode.");
      setOnboardingMode("manual");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const styleOptions = {
    formality: [
      { value: "casual", label: t('onboarding.styles.casual.label'), desc: t('onboarding.styles.casual.desc') },
      { value: "balanced", label: t('onboarding.styles.balanced.label'), desc: t('onboarding.styles.balanced.desc') },
      { value: "formal", label: t('onboarding.styles.formal.label'), desc: t('onboarding.styles.formal.desc') }
    ],
    humor: [
      { value: "playful", label: t('onboarding.styles.playful.label'), desc: t('onboarding.styles.playful.desc') },
      { value: "witty", label: t('onboarding.styles.witty.label'), desc: t('onboarding.styles.witty.desc') },
      { value: "serious", label: t('onboarding.styles.serious.label'), desc: t('onboarding.styles.serious.desc') }
    ],
    length: [
      { value: "brief", label: t('onboarding.styles.brief.label'), desc: t('onboarding.styles.brief.desc') },
      { value: "detailed", label: t('onboarding.styles.detailed.label'), desc: t('onboarding.styles.detailed.desc') },
      { value: "conversational", label: t('onboarding.styles.conversational.label'), desc: t('onboarding.styles.conversational.desc') }
    ]
  };

  if (onboardingMode === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-grid">
        <GlassCard className="max-w-4xl w-full p-8 grid md:grid-cols-2 gap-8 items-center" glow>
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">Create Your <span className="gradient-text">Digital Twin</span></h1>
              <p className="text-muted-foreground text-lg">How would you like to build your AI profile?</p>
            </div>

            <div className="grid gap-4">
              <button
                onClick={() => setOnboardingMode("voice")}
                className="group relative overflow-hidden rounded-xl border border-primary/20 bg-primary/5 p-6 text-left hover:bg-primary/10 transition-all hover:border-primary/50"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-primary/20 text-primary group-hover:scale-110 transition-transform">
                    <Mic size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                      Talk to AI <span className="text-[10px] bg-primary text-black px-2 py-0.5 rounded-full font-bold">Recommended</span>
                    </h3>
                    <p className="text-sm text-muted-foreground">Answer a few questions verbally. We'll clone your voice and build your profile instantly.</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setOnboardingMode("manual")}
                className="group rounded-xl border border-white/10 bg-black/20 p-6 text-left hover:bg-white/5 transition-all hover:border-white/20"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-secondary/20 text-secondary group-hover:scale-110 transition-transform">
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Manual Entry</h3>
                    <p className="text-sm text-muted-foreground">Fill out the profile form yourself. Traditional and detailed.</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="hidden md:flex justify-center">
            <div className="relative w-80 h-80">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-full blur-[100px] animate-pulse" />
              <Avatar3D size="xl" />
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (onboardingMode === "voice" && step < 5) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-grid relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute w-[800px] h-[800px] bg-purple-500/10 rounded-full blur-3xl"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
            style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
          />
        </div>

        <GlassCard className="max-w-lg w-full p-12 text-center relative z-10" glow>
          {isAnalyzing ? (
            <div className="space-y-6">
              <div className="w-20 h-20 mx-auto relative">
                <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-primary/30 border-l-transparent animate-spin" />
                <div className="absolute inset-2 rounded-full bg-primary/10 flex items-center justify-center">
                  <Brain className="text-primary animate-pulse" size={32} />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Analyzing...</h2>
                <p className="text-muted-foreground">Cloning your voice and extracting your personality.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold mb-4">Interivew Mode</h2>
                <p className="text-lg text-muted-foreground">
                  "Tell me about yourself. What do you do? What are your hobbies? What defines your personality?"
                </p>
              </div>

              <div className="relative h-40 flex items-center justify-center">
                {isRecording && (
                  <motion.div
                    className="absolute inset-0 bg-red-500/20 rounded-full blur-xl"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all ${isRecording ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary/90"
                    }`}
                >
                  {isRecording ? <div className="w-8 h-8 bg-white rounded-md" /> : <Mic size={40} className="text-black" />}
                </button>
              </div>

              <p className="text-sm font-medium">
                {isRecording ? "Listening... (Click to Stop)" : "Click mic to answer (1 min max)"}
              </p>

              <Button variant="ghost" onClick={() => setOnboardingMode(null)}>
                Back to Menu
              </Button>
            </div>
          )}
        </GlassCard>

        {/* Hidden Audio Visualizer could go here */}
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-grid relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-[500px] h-[500px] bg-neon-cyan/5 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity }}
          style={{ top: "20%", left: "50%", transform: "translateX(-50%)" }}
        />
      </div>

      <div className="max-w-2xl mx-auto pt-8 relative z-10">
        <motion.div className="text-center mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Logo size="md" />
        </motion.div>

        {/* Progress bar */}
        <div className="flex justify-center gap-2 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <motion.div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${i + 1 <= step ? "bg-primary w-12" : "bg-muted w-8"
                }`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1 }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Basic Identity */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <GlassCard className="p-8" glow>
                <div className="text-center mb-8">
                  <motion.div
                    className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <User size={16} />
                    {t('onboarding.digitalIdentity')}
                  </motion.div>
                  <h1 className="text-3xl font-bold mb-4">
                    {t('onboarding.title')} <span className="gradient-text">AI Avatar</span>
                  </h1>
                  <p className="text-muted-foreground">
                    {t('onboarding.step1Desc')}
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Sparkles size={16} className="text-primary" />
                      {t('onboarding.nickname')}
                    </label>
                    <Input
                      placeholder={t('onboarding.nicknamePlaceholder')}
                      value={formData.nickname}
                      onChange={(e) => updateField("nickname", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <MessageSquare size={16} className="text-secondary" />
                      {t('onboarding.tagline')}
                    </label>
                    <Input
                      placeholder={t('onboarding.taglinePlaceholder')}
                      value={formData.tagline}
                      onChange={(e) => updateField("tagline", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">{t('onboarding.taglineDesc')}</p>
                  </div>
                </div>

                <Button onClick={handleNext} className="w-full mt-8" variant="neon" size="lg">
                  {t('onboarding.continue')} <ArrowRight size={18} />
                </Button>
              </GlassCard>
            </motion.div>
          )}

          {/* Step 2: Communication Style */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <GlassCard className="p-8" glow>
                <div className="text-center mb-8">
                  <motion.div
                    className="inline-flex items-center gap-2 bg-secondary/20 text-secondary px-4 py-2 rounded-full text-sm font-medium mb-4"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <Brain size={16} />
                    {t('onboarding.step2Title')}
                  </motion.div>
                  <h2 className="text-2xl font-bold mb-2">{t('onboarding.step2Heading')}</h2>
                  <p className="text-muted-foreground">{t('onboarding.step2Desc')}</p>
                </div>

                <div className="space-y-8">
                  {/* Formality */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">{t('onboarding.formality')}</label>
                    <div className="grid grid-cols-3 gap-3">
                      {styleOptions.formality.map((opt) => (
                        <motion.button
                          key={opt.value}
                          type="button"
                          className={`glass-card p-3 text-center transition-all ${formData.formalityLevel === opt.value ? "border-primary neon-glow" : "hover:border-primary/50"
                            }`}
                          onClick={() => updateField("formalityLevel", opt.value)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="text-lg mb-1">{opt.label}</div>
                          <div className="text-xs text-muted-foreground">{opt.desc}</div>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Humor */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">{t('onboarding.humor')}</label>
                    <div className="grid grid-cols-3 gap-3">
                      {styleOptions.humor.map((opt) => (
                        <motion.button
                          key={opt.value}
                          type="button"
                          className={`glass-card p-3 text-center transition-all ${formData.humorStyle === opt.value ? "border-primary neon-glow" : "hover:border-primary/50"
                            }`}
                          onClick={() => updateField("humorStyle", opt.value)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="text-lg mb-1">{opt.label}</div>
                          <div className="text-xs text-muted-foreground">{opt.desc}</div>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Response Length */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">{t('onboarding.responseLength')}</label>
                    <div className="grid grid-cols-3 gap-3">
                      {styleOptions.length.map((opt) => (
                        <motion.button
                          key={opt.value}
                          type="button"
                          className={`glass-card p-3 text-center transition-all ${formData.responseLength === opt.value ? "border-primary neon-glow" : "hover:border-primary/50"
                            }`}
                          onClick={() => updateField("responseLength", opt.value)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="text-lg mb-1">{opt.label}</div>
                          <div className="text-xs text-muted-foreground">{opt.desc}</div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <Button onClick={handleBack} variant="outline" size="lg" className="gap-2">
                    <ArrowLeft size={18} /> {t('onboarding.back')}
                  </Button>
                  <Button onClick={handleNext} className="flex-1" variant="neon" size="lg">
                    {t('onboarding.continue')} <ArrowRight size={18} />
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Step 3: Expertise & Hobbies */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <GlassCard className="p-8" glow>
                <div className="text-center mb-8">
                  <motion.div
                    className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <Zap size={16} />
                    {t('onboarding.step3Title')}
                  </motion.div>
                  <h2 className="text-2xl font-bold mb-2">{t('onboarding.step3Heading')}</h2>
                  <p className="text-muted-foreground">{t('onboarding.step3Desc')}</p>
                </div>

                <div className="space-y-6">
                  {/* Expertise */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Brain size={16} className="text-primary" />
                      {t('onboarding.expertise')}
                    </label>
                    <div className="flex gap-2">
                      <Input
                        placeholder={t('onboarding.expertisePlaceholder')}
                        value={expertInput}
                        onChange={(e) => setExpertInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToArray("expertise", expertInput))}
                      />
                      <Button type="button" variant="outline" onClick={() => addToArray("expertise", expertInput)}>
                        <Plus size={18} />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.expertise.map((item) => (
                        <motion.span
                          key={item}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/20 text-primary text-sm"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          {item}
                          <button onClick={() => removeFromArray("expertise", item)} className="hover:text-white">
                            <X size={14} />
                          </button>
                        </motion.span>
                      ))}
                    </div>
                  </div>

                  {/* Hobbies */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Heart size={16} className="text-secondary" />
                      {t('onboarding.hobbies')}
                    </label>
                    <div className="flex gap-2">
                      <Input
                        placeholder={t('onboarding.hobbiesPlaceholder')}
                        value={hobbyInput}
                        onChange={(e) => setHobbyInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToArray("hobbies", hobbyInput))}
                      />
                      <Button type="button" variant="outline" onClick={() => addToArray("hobbies", hobbyInput)}>
                        <Plus size={18} />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.hobbies.map((item) => (
                        <motion.span
                          key={item}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary/20 text-secondary text-sm"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          {item}
                          <button onClick={() => removeFromArray("hobbies", item)} className="hover:text-white">
                            <X size={14} />
                          </button>
                        </motion.span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <Button onClick={handleBack} variant="outline" size="lg" className="gap-2">
                    <ArrowLeft size={18} /> {t('onboarding.back')}
                  </Button>
                  <Button onClick={handleNext} className="flex-1" variant="neon" size="lg">
                    {t('onboarding.continue')} <ArrowRight size={18} />
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Step 4: Sample Q&A */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <GlassCard className="p-8" glow>
                <div className="text-center mb-8">
                  <motion.div
                    className="inline-flex items-center gap-2 bg-secondary/20 text-secondary px-4 py-2 rounded-full text-sm font-medium mb-4"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <MessageSquare size={16} />
                    {t('onboarding.step4Title')}
                  </motion.div>
                  <h2 className="text-2xl font-bold mb-2">{t('onboarding.step4Heading')}</h2>
                  <p className="text-muted-foreground">{t('onboarding.step4Desc')}</p>
                </div>

                <div className="space-y-6">
                  {/* Add new Q&A */}
                  <div className="glass-card p-4 space-y-3">
                    <Input
                      placeholder={t('onboarding.questionPlaceholder')}
                      value={tempQA.question}
                      onChange={(e) => setTempQA({ ...tempQA, question: e.target.value })}
                    />
                    <Textarea
                      placeholder={t('onboarding.answerPlaceholder')}
                      value={tempQA.answer}
                      onChange={(e) => setTempQA({ ...tempQA, answer: e.target.value })}
                      rows={3}
                    />
                    <Button type="button" variant="outline" className="w-full gap-2" onClick={addSampleQA}>
                      <Plus size={16} /> {t('onboarding.addExample')}
                    </Button>
                  </div>

                  {/* Existing Q&As */}
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {formData.sampleQA.map((qa, index) => (
                      <motion.div
                        key={index}
                        className="glass-card p-4 relative"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <button
                          onClick={() => removeSampleQA(index)}
                          className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                        >
                          <X size={16} />
                        </button>
                        <p className="text-sm font-medium text-primary mb-1">Q: {qa.question}</p>
                        <p className="text-sm text-muted-foreground">A: {qa.answer}</p>
                      </motion.div>
                    ))}
                    {formData.sampleQA.length === 0 && (
                      <p className="text-center text-muted-foreground text-sm py-4">
                        {t('onboarding.noExamples')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <Button onClick={handleBack} variant="outline" size="lg" className="gap-2">
                    <ArrowLeft size={18} /> {t('onboarding.back')}
                  </Button>
                  <Button onClick={handleNext} className="flex-1" variant="neon" size="lg">
                    {t('onboarding.continue')} <ArrowRight size={18} />
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Step 5: Avatar Selection */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <GlassCard className="p-8" glow>
                <div className="text-center mb-8">
                  <motion.div
                    className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <Smile size={16} />
                    {t('onboarding.step5Title')}
                  </motion.div>
                  <h2 className="text-2xl font-bold mb-2">{t('onboarding.step5Heading')}</h2>
                  <p className="text-muted-foreground">{t('onboarding.step5Desc')}</p>
                </div>

                <div className="flex justify-center mb-8">
                  <Avatar3D gender={formData.gender} size="xl" />
                </div>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  {(["male", "female", "neutral"] as const).map((gender) => (
                    <motion.button
                      key={gender}
                      type="button"
                      className={`glass-card p-4 text-center transition-all ${formData.gender === gender ? "border-primary neon-glow" : "hover:border-primary/50"
                        }`}
                      onClick={() => updateField("gender", gender)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Avatar3D gender={gender} size="sm" animated={false} />
                      <p className="text-sm font-medium mt-2 capitalize">{t(`onboarding.gender.${gender}`)}</p>
                    </motion.button>
                  ))}
                </div>

                <div className="flex gap-4">
                  {(onboardingMode === "manual" || onboardingMode === null) && (
                    <Button onClick={handleBack} variant="outline" size="lg" className="gap-2">
                      <ArrowLeft size={18} /> {t('onboarding.back')}
                    </Button>
                  )}
                  <Button onClick={handleNext} className="flex-1" variant="neon" size="lg">
                    <Sparkles size={18} />
                    {t('onboarding.createAvatar')}
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Onboarding;
