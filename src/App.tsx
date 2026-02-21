import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import OnboardingNew from "./pages/OnboardingNew";
import AvatarCreation from "./pages/AvatarCreation";
import PublicProfile from "./pages/PublicProfile";
import Share from "./pages/Share";
import Interact from "./pages/Interact";
import Dashboard from "./pages/Dashboard";
import Training from "./pages/Training";
import ForgotPassword from "./pages/ForgotPassword";

import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";

import Settings from "./pages/Settings";
import TermsOfService from "./pages/TermsOfService";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={<OnboardingNew />} />
          <Route path="/avatar" element={<AvatarCreation />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/training" element={<Training />} />
          <Route path="/interact/:username" element={<Interact />} />
          <Route path="/profile/:username" element={<PublicProfile />} />
          <Route path="/share" element={<Share />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/terms" element={<TermsOfService />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
