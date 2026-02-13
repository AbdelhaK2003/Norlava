import { motion } from "framer-motion";
import { useTranslation } from 'react-i18next';
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Avatar3D } from "@/components/Avatar3D";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  MessageCircle,
  Share2,
  Brain,
  ArrowRight,
  Play,
  Mic,
  Globe,
  Shield,
  Zap,
  Users,
  ChevronDown,
  Check,
  Star,
  Menu, // Added Menu icon
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    navigate("/");
  };


  const features = [
    {
      icon: Brain,
      title: "AI-Powered Learning",
      description:
        "Your avatar learns your personality, interests, and communication style to represent you authentically.",
    },
    {
      icon: MessageCircle,
      title: "Natural Conversations",
      description:
        "Visitors can chat with your AI avatar 24/7, getting genuine responses that sound just like you.",
    },
    {
      icon: Share2,
      title: "Easy Sharing",
      description:
        "Share your unique profile link on social media and let your AI introduce you to the world.",
    },
  ];

  const howItWorks = [
    {
      step: 1,
      title: "Create Your Profile",
      description: "Sign up and tell us about yourself - your interests, expertise, and how you like to communicate.",
      icon: Users,
    },
    {
      step: 2,
      title: "Train Your Avatar",
      description: "Add sample Q&A pairs to teach your AI how you'd respond to common questions.",
      icon: Brain,
    },
    {
      step: 3,
      title: "Customize Your Style",
      description: "Choose your avatar's look and fine-tune its personality settings.",
      icon: Sparkles,
    },
    {
      step: 4,
      title: "Share & Connect",
      description: "Get your unique link and let visitors interact with your AI avatar instantly.",
      icon: Globe,
    },
  ];

  const useCases = [
    {
      title: "Content Creators",
      description: "Let fans interact with your AI 24/7. Answer FAQs automatically while you focus on creating.",
      emoji: "🎬",
    },
    {
      title: "Professionals",
      description: "Create a digital business card that actually talks. Perfect for networking events.",
      emoji: "💼",
    },
    {
      title: "Developers",
      description: "Showcase your skills interactively. Let your AI discuss your projects and tech stack.",
      emoji: "👨‍💻",
    },
    {
      title: "Artists",
      description: "Let your AI share your creative process, inspirations, and available commissions.",
      emoji: "🎨",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "YouTuber",
      avatar: "S",
      text: "My fans love chatting with my AI! It handles hundreds of messages while I'm editing videos.",
    },
    {
      name: "Marcus Rodriguez",
      role: "Software Engineer",
      avatar: "M",
      text: "Added my Norlava link to my portfolio. Recruiters say it's the most unique thing they've seen.",
    },
    {
      name: "Emma Thompson",
      role: "Life Coach",
      avatar: "E",
      text: "My AI avatar handles initial consultations perfectly. It's like having a 24/7 receptionist.",
    },
  ];

  const faqs = [
    {
      question: "How does the AI learn to sound like me?",
      answer: "During onboarding, you'll set your communication style preferences and provide sample Q&A pairs. The more examples you give, the more accurate your avatar becomes. You can always refine it later!",
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use industry-standard encryption and never share your personal information. Your training data stays private and is only used to power YOUR avatar.",
    },
    {
      question: "Can I try it before signing up?",
      answer: "We recommend creating a free account to get the full experience! You can customize your own avatar in minutes without any credit card.",
    },
    {
      question: "Does it support voice conversations?",
      answer: "Yes! Visitors can speak to your avatar using their microphone, and your AI will respond with synthesized speech - no typing required.",
    },
    {
      question: "How do I share my avatar?",
      answer: "You'll get a unique link (like norlava.com/u/yourname) that you can share anywhere - social media, email signatures, business cards, or QR codes.",
    },
  ];

  const stats = [
    { value: "50K+", label: "Avatars Created" },
    { value: "2M+", label: "Conversations" },
    { value: "99%", label: "Uptime" },
    { value: "4.9★", label: "User Rating" },
  ];

  return (
    <div className="min-h-screen bg-grid relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-[800px] h-[800px] bg-neon-cyan/5 rounded-full blur-3xl"
          animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
          style={{ top: "-20%", left: "-10%" }}
        />
        <motion.div
          className="absolute w-[600px] h-[600px] bg-neon-purple/5 rounded-full blur-3xl"
          animate={{ x: [0, -80, 0], y: [0, 60, 0] }}
          transition={{ duration: 15, repeat: Infinity }}
          style={{ bottom: "-10%", right: "-10%" }}
        />
      </div>

      {/* Navigation */}
      {/* Navigation */}
      <nav className="relative z-20 p-4 md:p-6 border-b border-glass-border/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo size="lg" />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#use-cases" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Use Cases</a>
            <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            {isLoggedIn ? (
              <>
                <Button variant="ghost" onClick={handleLogout} className="hidden md:flex">
                  Sign Out
                </Button>
                <Button variant="neon" onClick={() => navigate("/dashboard")} className="hidden md:flex">
                  Dashboard
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/login")} className="hidden md:flex">
                  Sign In
                </Button>
                <Button variant="outline" onClick={() => navigate("/register")} className="hidden md:flex">
                  Get Started
                </Button>
              </>
            )}

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] border-l border-glass-border bg-black/95 backdrop-blur-xl">
                <SheetHeader>
                  <SheetTitle className="text-left"><Logo size="md" /></SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-6 mt-8">
                  <div className="flex flex-col gap-4">
                    <a href="#how-it-works" className="text-lg font-medium text-muted-foreground hover:text-primary transition-colors">How It Works</a>
                    <a href="#features" className="text-lg font-medium text-muted-foreground hover:text-primary transition-colors">Features</a>
                    <a href="#use-cases" className="text-lg font-medium text-muted-foreground hover:text-primary transition-colors">Use Cases</a>
                    <a href="#faq" className="text-lg font-medium text-muted-foreground hover:text-primary transition-colors">FAQ</a>
                  </div>

                  <div className="h-px bg-glass-border w-full my-2" />

                  <div className="flex flex-col gap-3">
                    {isLoggedIn ? (
                      <>
                        <Button variant="neon" onClick={() => navigate("/dashboard")} className="w-full">
                          Dashboard
                        </Button>
                        <Button variant="ghost" onClick={handleLogout} className="w-full justify-start px-0">
                          Sign Out
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" onClick={() => navigate("/register")} className="w-full">
                          Get Started
                        </Button>
                        <Button variant="ghost" onClick={() => navigate("/login")} className="w-full justify-start px-0">
                          Sign In
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-24 md:pt-32 md:pb-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center lg:text-left flex flex-col items-center lg:items-start"
          >
            <motion.div
              className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold mb-6 tracking-wide uppercase"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Sparkles size={14} />
              {t('landing.heroBadge', 'Digital Identity Reimagined')}
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-[1.1] tracking-tighter text-foreground">
              {t('landing.heroTitle', 'Create Your')} <span className="gradient-text">{t('landing.heroTitleHighlight', 'AI Twin')}</span> {t('landing.heroTitleSuffix', '')}
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-lg leading-relaxed">
              {t('landing.heroDesc', 'Preserve your personality, knowledge, and style in an intelligent AI avatar. Allow others to interact with you, anytime, anywhere.')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10 justify-center lg:justify-start w-full sm:w-auto">
              <Button
                variant="hero"
                onClick={() => navigate(isLoggedIn ? "/dashboard" : "/register")}
                className="gap-2 w-full sm:w-auto h-12 px-8 text-base shadow-neon-glow hover:shadow-neon-strong transition-all duration-300"
              >
                {isLoggedIn ? "Go to Dashboard" : t('landing.cta', 'Start Creating')}
                <ArrowRight size={18} />
              </Button>
            </div>

            {/* Mini stats / Trust indicators */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground justify-center lg:justify-start">
              <div className="flex items-center gap-2">
                <Check size={16} className="text-primary" />
                <span>Free Tier Available</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={16} className="text-primary" />
                <span>No Credit Card Required</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="relative flex justify-center lg:justify-end"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {/* Main avatar display */}
            <div className="relative w-full max-w-[400px] aspect-square">
              {/* Abstract bg element */}
              <div className="absolute inset-0 bg-gradient-radial from-primary/20 to-transparent blur-3xl opacity-50" />

              <Avatar3D size="xl" className="w-full h-full scale-125 md:scale-150" />

              {/* Feature Tags - Static/Subtle animation for Pro look */}
              <div className="absolute -top-6 right-0 glass-card px-4 py-2 text-xs font-semibold flex items-center gap-2 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Always On
              </div>

              <div className="absolute bottom-10 -left-6 glass-card px-4 py-2 text-xs font-semibold shadow-lg hidden sm:flex items-center gap-2">
                <Brain size={14} className="text-secondary" />
                Deep Learning
              </div>

              {/* Updated Voice Badge */}
              <div className="absolute top-1/2 -right-8 glass-card px-4 py-2 text-xs font-semibold shadow-lg flex items-center gap-2 border-primary/20">
                <Mic size={14} className="text-muted-foreground" />
                <span className="text-muted-foreground">Voice (Coming Soon)</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar/Trust Section - Simplified */}
      <section className="relative z-10 border-y border-glass-border bg-card/10 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={stat.label} className="text-center">
                {/* Removed animation for simpler, faster load */}
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-1 tracking-tight">{stat.value}</div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-6 tracking-tight">
            Seamless <span className="gradient-text">Integration</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Build your digital twin in four simple steps. No coding required.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {howItWorks.map((item, index) => (
            <GlassCard key={item.step} className="h-full p-6 md:p-8 relative overflow-hidden group hover:border-primary/30 transition-colors duration-500">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 text-primary group-hover:bg-primary group-hover:text-black transition-colors duration-300">
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
            Engineered for <span className="gradient-text">Authenticity</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Advanced features designed to capture the essence of who you are.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <GlassCard key={feature.title} className="h-full p-8 md:p-10" neonBorder>
              <feature.icon className="w-10 h-10 text-primary mb-6" />
              <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </GlassCard>
          ))}
        </div>

        {/* Additional features grid - Clean list */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Mic, title: "Voice Interaction", desc: "Coming Soon" },
            { icon: Shield, title: "Privacy First", desc: "Encrypted Data" },
            { icon: Zap, title: "Instant Training", desc: "Real-time Updates" },
            { icon: Globe, title: "Global Access", desc: "Available 24/7" },
          ].map((item, index) => (
            <div key={item.title} className="glass-card p-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <item.icon size={20} className="text-secondary" />
              </div>
              <div>
                <div className="font-semibold text-sm">{item.title}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="relative z-10 bg-card/30 border-y border-glass-border">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-4">
              Perfect For <span className="gradient-text">Everyone</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Whether you're a creator, professional, or just want a fun digital presence.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase, index) => (
              <motion.div
                key={useCase.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard className="h-full p-6 text-center hover:border-primary/50 transition-colors">
                  <div className="text-4xl mb-4">{useCase.emoji}</div>
                  <h3 className="text-lg font-bold mb-2">{useCase.title}</h3>
                  <p className="text-sm text-muted-foreground">{useCase.description}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold mb-4">
            Loved by <span className="gradient-text">Users</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See what our community is saying about their AI avatars.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard className="h-full p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className="text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 italic">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-medium">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative z-10 bg-card/30 border-y border-glass-border">
        <div className="max-w-3xl mx-auto px-6 py-24">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-4">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>
            <p className="text-muted-foreground">
              Everything you need to know about Norlava.
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard className="overflow-hidden">
                  <button
                    className="w-full p-4 flex items-center justify-between text-left"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  >
                    <span className="font-medium pr-4">{faq.question}</span>
                    <ChevronDown
                      size={20}
                      className={`text-muted-foreground transition-transform flex-shrink-0 ${openFaq === index ? "rotate-180" : ""
                        }`}
                    />
                  </button>
                  <motion.div
                    initial={false}
                    animate={{ height: openFaq === index ? "auto" : 0 }}
                    className="overflow-hidden"
                  >
                    <p className="px-4 pb-4 text-muted-foreground">{faq.answer}</p>
                  </motion.div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-24">
        <GlassCard className="p-12 text-center" glow neonBorder>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-4">
              Ready to Meet Your <span className="gradient-text">Digital Self</span>?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Join thousands of users who have already created their personal AI
              avatar. Start your journey today.
            </p>
            <Button
              variant="hero"
              onClick={() => navigate("/register")}
              className="gap-2"
            >
              <Sparkles size={20} />
              Create Your Avatar Now
              <ArrowRight size={20} />
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Free to start • No credit card required
            </p>
          </motion.div>
        </GlassCard>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-glass-border py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Logo size="sm" />
              <p className="text-sm text-muted-foreground mt-3">
                Your AI-powered digital identity platform.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a></li>
                <li><a href="#use-cases" className="hover:text-foreground transition-colors">Use Cases</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-glass-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              <p>© 2026 Norlava. Your digital legacy starts here.</p>
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" /></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
