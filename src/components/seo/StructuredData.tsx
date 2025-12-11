import { useEffect } from 'react';

const BASE_URL = 'https://clilin.com.br';

interface OrganizationSchemaProps {
  type: 'Organization';
}

interface WebSiteSchemaProps {
  type: 'WebSite';
}

interface FAQSchemaProps {
  type: 'FAQPage';
  faqs: Array<{ question: string; answer: string }>;
}

interface ArticleSchemaProps {
  type: 'Article';
  title: string;
  description: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  author: string;
  url: string;
}

interface BreadcrumbSchemaProps {
  type: 'BreadcrumbList';
  items: Array<{ name: string; url: string }>;
}

interface LocalBusinessSchemaProps {
  type: 'LocalBusiness';
  city: string;
  businessName: string;
}

type StructuredDataProps =
  | OrganizationSchemaProps
  | WebSiteSchemaProps
  | FAQSchemaProps
  | ArticleSchemaProps
  | BreadcrumbSchemaProps
  | LocalBusinessSchemaProps;

function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Clilin',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description: 'Plataforma de ofertas locais e programa de afiliados para comércio local',
    foundingDate: '2024',
    sameAs: [
      'https://instagram.com/clilin',
      'https://facebook.com/clilin',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'contato@clilin.com.br',
      availableLanguage: ['Portuguese'],
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Viçosa',
      addressRegion: 'MG',
      addressCountry: 'BR',
    },
  };
}

function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Clilin',
    url: BASE_URL,
    description: 'Ofertas locais e programa de afiliados',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/ofertas?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

function generateArticleSchema(props: ArticleSchemaProps) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: props.title,
    description: props.description,
    image: props.image || `${BASE_URL}/og-image.png`,
    datePublished: props.datePublished,
    dateModified: props.dateModified || props.datePublished,
    author: {
      '@type': 'Person',
      name: props.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Clilin',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${BASE_URL}${props.url}`,
    },
  };
}

function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${BASE_URL}${item.url}`,
    })),
  };
}

function generateLocalBusinessSchema(city: string, businessName: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: businessName,
    address: {
      '@type': 'PostalAddress',
      addressLocality: city,
      addressCountry: 'BR',
    },
    url: BASE_URL,
    priceRange: '$$',
  };
}

export function StructuredData(props: StructuredDataProps) {
  useEffect(() => {
    let schema: object;

    switch (props.type) {
      case 'Organization':
        schema = generateOrganizationSchema();
        break;
      case 'WebSite':
        schema = generateWebSiteSchema();
        break;
      case 'FAQPage':
        schema = generateFAQSchema(props.faqs);
        break;
      case 'Article':
        schema = generateArticleSchema(props);
        break;
      case 'BreadcrumbList':
        schema = generateBreadcrumbSchema(props.items);
        break;
      case 'LocalBusiness':
        schema = generateLocalBusinessSchema(props.city, props.businessName);
        break;
      default:
        return;
    }

    const scriptId = `structured-data-${props.type}`;
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }

    script.textContent = JSON.stringify(schema);

    return () => {
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [props]);

  return null;
}
