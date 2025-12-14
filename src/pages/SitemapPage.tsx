import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const SitemapPage = () => {
  const [xml, setXml] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSitemap = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("generate-sitemap");
        
        if (error) {
          console.error("Error fetching sitemap:", error);
          return;
        }
        
        // The response is already XML text
        if (typeof data === "string") {
          setXml(data);
        } else {
          // If it's returned as an object, try to get the text
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-sitemap`
          );
          const text = await response.text();
          setXml(text);
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSitemap();
  }, []);

  // Set document content type via meta tag workaround
  useEffect(() => {
    if (xml && !loading) {
      // Replace the entire document with XML
      document.open("text/xml");
      document.write(xml);
      document.close();
    }
  }, [xml, loading]);

  if (loading) {
    return null;
  }

  return null;
};

export default SitemapPage;
