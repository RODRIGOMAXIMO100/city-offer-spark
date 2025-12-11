import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { WhyDifferent } from "@/components/landing/WhyDifferent";
import { PublicAIChat } from "@/components/landing/PublicAIChat";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ForCompanies } from "@/components/landing/ForCompanies";
import { ForAffiliates } from "@/components/landing/ForAffiliates";
import { ForClients } from "@/components/landing/ForClients";
import { FAQ, faqs } from "@/components/landing/FAQ";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { StructuredData } from "@/components/seo/StructuredData";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  // Handle hash scroll when coming from another page
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      setTimeout(() => {
        const element = document.getElementById(id);
        element?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [location.hash]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead canonicalUrl="/" />
      <StructuredData type="Organization" />
      <StructuredData type="WebSite" />
      <StructuredData type="FAQPage" faqs={faqs} />
      
      <Navbar />
      <main>
        <HeroSection />
        <WhyDifferent />
        <PublicAIChat />
        <HowItWorks />
        <ForCompanies />
        <ForAffiliates />
        <ForClients />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
