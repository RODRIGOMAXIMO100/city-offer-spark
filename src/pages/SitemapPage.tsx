import { useEffect } from "react";

const SitemapPage = () => {
  useEffect(() => {
    // Redirect to the edge function that returns valid XML with correct Content-Type
    window.location.href = "https://sukvjgxxuzophzjcojvd.supabase.co/functions/v1/generate-sitemap";
  }, []);

  return null;
};

export default SitemapPage;
