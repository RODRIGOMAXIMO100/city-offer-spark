import { useEffect } from 'react';

/**
 * Renders a noindex,nofollow robots meta so private/auth/dashboard routes
 * don't get indexed by Google/Bing (fixes "crawled but not indexed" noise).
 */
export function NoIndex() {
  useEffect(() => {
    const prev = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    const prevContent = prev?.content;

    let meta = prev;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
    }
    meta.content = 'noindex, nofollow';

    return () => {
      if (meta) meta.content = prevContent ?? 'index, follow';
    };
  }, []);

  return null;
}
