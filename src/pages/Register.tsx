import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, ArrowRight, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

const Register = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    birthday: "",
    password: "",
  });
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Call Backend API
      const { data } = await api.post('/auth/register', formData);

      // Save token
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user)); // For simple offline access if needed earlier

      toast({
        title: t('auth.accountCreated'),
        description: t('auth.welcomeToVoxterna'),
      });

      // Navigate
      navigate("/onboarding");
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.error || "Registration failed";

      toast({
        variant: "destructive",
        title: t('auth.registrationFailed'),
        description: errorMessage,
      });
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-grid relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl"
          animate={{ x: [0, -50, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
          style={{ top: "5%", right: "10%" }}
        />
        <motion.div
          className="absolute w-80 h-80 bg-neon-cyan/10 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -50, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
          style={{ bottom: "5%", left: "10%" }}
        />
      </div>

      <div className="w-full max-w-md relative z-10 py-8">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-center mb-6">
            <Logo size="lg" />
          </div>
          <p className="text-muted-foreground">
            {t('auth.registerSubtitle')}
          </p>
        </motion.div>

        <GlassCard className="p-8" glow>
          {/* Email Register Only */}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {t('auth.firstName')}
                </label>
                <Input
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {t('auth.lastName')}
                </label>
                <Input
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t('auth.email')}
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {t('auth.birthday')}
                </label>
                <Input
                  type="date"
                  value={formData.birthday}
                  onChange={(e) => updateField("birthday", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t('auth.password')}
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" variant="neon" size="lg">
              <Sparkles size={18} />
              {t('auth.createAvatar')}
              <ArrowRight size={18} />
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t('auth.alreadyHaveAccount')}{" "}
              <Link
                to="/login"
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                {t('auth.login')}
              </Link>
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default Register;
