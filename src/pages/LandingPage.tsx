import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeHowItWorks } from "@/components/home/HomeHowItWorks";
import { HomeWhyItWorks } from "@/components/home/HomeWhyItWorks";
import { HomeForCompanies } from "@/components/home/HomeForCompanies";
import { HomeForAffiliates } from "@/components/home/HomeForAffiliates";
import { HomeComingSoon } from "@/components/home/HomeComingSoon";
import { HomeFAQ, homeFaqs } from "@/components/home/HomeFAQ";
import { HomeFinalCTA } from "@/components/home/HomeFinalCTA";
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

  // Rola até a seção quando chega de outra página com #ancora
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
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
      <StructuredData type="FAQPage" faqs={homeFaqs} />

      <Navbar />
      <main>
        <HomeHero />
        <HomeHowItWorks />
        <HomeWhyItWorks />
        <HomeForCompanies />
        <HomeForAffiliates />
        <HomeComingSoon />
        <HomeFAQ />
        <HomeFinalCTA />
      </main>
      <Footer />
    </div>
  );
}
