import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import LandingPage from "./pages/LandingPage";
import ChatPage from "./pages/ChatPage";
import AuthPage from "./pages/AuthPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import DashboardPage from "./pages/DashboardPage";
import AdminDashboard from "./components/dashboard/AdminDashboard";
import OfferPage from "./pages/OfferPage";
import ShortLinkRedirect from "./pages/ShortLinkRedirect";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import AboutPage from "./pages/AboutPage";
import TransparencyPage from "./pages/TransparencyPage";
import BlogPage from "./pages/BlogPage";
import BlogPostPage from "./pages/BlogPostPage";
import AuthorPage from "./pages/AuthorPage";
import HelpPage from "./pages/HelpPage";
import NotFound from "./pages/NotFound";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import CompleteSignupPage from "./pages/CompleteSignupPage";

import WhatsAppButton from "./components/WhatsAppButton";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  
  if (loading) return null;
  if (!user) return <Navigate to="/admin/login" replace />;
  
  // Wait for role to be fetched before redirecting
  if (role === null) return null;
  
  if (role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/chat" element={<ChatPage />} />
    <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
    <Route path="/auth/callback" element={<AuthCallbackPage />} />
    <Route path="/complete-signup" element={<CompleteSignupPage />} />
    <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
    <Route path="/admin/login" element={<AdminLoginPage />} />
    <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
    <Route path="/oferta/:id" element={<OfferPage />} />
    <Route path="/offer/:id" element={<OfferPage />} />
    <Route path="/o/:code" element={<ShortLinkRedirect />} />
    <Route path="/termos" element={<TermsPage />} />
    <Route path="/privacidade" element={<PrivacyPage />} />
    <Route path="/sobre" element={<AboutPage />} />
    <Route path="/transparencia" element={<TransparencyPage />} />
    <Route path="/blog" element={<BlogPage />} />
    <Route path="/blog/:slug" element={<BlogPostPage />} />
    <Route path="/autor/:slug" element={<AuthorPage />} />
    <Route path="/ajuda" element={<HelpPage />} />
    
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <OnboardingProvider>
            <AppRoutes />
            <WhatsAppButton />
          </OnboardingProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
