import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SitemapDynamicPage = () => {
  useEffect(() => {
    const fetchSitemap = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-sitemap`,
          {
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
          }
        );
        
        if (response.ok) {
          const xmlContent = await response.text();
          // Replace entire document with XML
          document.open('application/xml');
          document.write(xmlContent);
          document.close();
        }
      } catch (error) {
        console.error('Error fetching sitemap:', error);
      }
    };
    
    fetchSitemap();
  }, []);

  return null;
};

export default SitemapDynamicPage;
