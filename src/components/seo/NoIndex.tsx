import { useEffect } from 'react';

/**
 * Sets <meta name="robots" content="noindex, nofollow"> for the current route
 * so private/auth/dashboard pages don't get indexed. Restores on unmount.
 */
export function NoIndex() {
  useNoIndex();
  return null;
}

export function useNoIndex() {
  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    const prevContent = meta?.content;
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
}
