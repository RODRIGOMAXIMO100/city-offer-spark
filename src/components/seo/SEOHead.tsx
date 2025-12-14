import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  articlePublishedTime?: string;
  articleAuthor?: string;
  noIndex?: boolean;
}

const BASE_URL = 'https://clilin.com';
const DEFAULT_TITLE = 'Clilin - Ofertas Locais, Descontos e Programa de Afiliados';
const DEFAULT_DESCRIPTION = 'Descubra as melhores ofertas e descontos de empresas locais. Ganhe dinheiro como afiliado divulgando promoções na sua cidade. Cadastre-se grátis!';
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;

export function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = [],
  canonicalUrl,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  articlePublishedTime,
  articleAuthor,
  noIndex = false,
}: SEOHeadProps) {
  const fullTitle = title ? `${title} | Clilin` : DEFAULT_TITLE;
  const fullCanonicalUrl = canonicalUrl ? `${BASE_URL}${canonicalUrl}` : BASE_URL;
  const defaultKeywords = [
    'ofertas locais',
    'descontos',
    'cupons',
    'afiliados',
    'marketing local',
    'promoções',
    'ganhar dinheiro',
    'divulgador',
    'comércio local',
  ];
  const allKeywords = [...new Set([...defaultKeywords, ...keywords])];

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Update or create meta tags
    const updateMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Basic meta tags
    updateMeta('description', description);
    updateMeta('keywords', allKeywords.join(', '));
    updateMeta('author', 'Clilin');
    updateMeta('robots', noIndex ? 'noindex, nofollow' : 'index, follow');

    // Open Graph
    updateMeta('og:title', fullTitle, true);
    updateMeta('og:description', description, true);
    updateMeta('og:type', ogType, true);
    updateMeta('og:url', fullCanonicalUrl, true);
    updateMeta('og:image', ogImage, true);
    updateMeta('og:site_name', 'Clilin', true);
    updateMeta('og:locale', 'pt_BR', true);

    // Twitter Card
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', fullTitle);
    updateMeta('twitter:description', description);
    updateMeta('twitter:image', ogImage);

    // Article specific
    if (ogType === 'article' && articlePublishedTime) {
      updateMeta('article:published_time', articlePublishedTime, true);
      if (articleAuthor) {
        updateMeta('article:author', articleAuthor, true);
      }
    }

    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = fullCanonicalUrl;

    return () => {
      // Cleanup is handled by next SEOHead mount
    };
  }, [fullTitle, description, allKeywords, fullCanonicalUrl, ogImage, ogType, articlePublishedTime, articleAuthor, noIndex]);

  return null;
}
