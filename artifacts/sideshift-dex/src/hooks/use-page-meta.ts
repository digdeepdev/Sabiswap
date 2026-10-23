import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { renderSeoHead } from '@/lib/seo';

// The same metadata is rendered at build time and after client-side navigation.
export function usePageMeta() {
  const [path] = useLocation();
  useEffect(() => {
    document.head.querySelectorAll(
      'title, meta[name="description"], meta[name="robots"], meta[property^="og:"], meta[name^="twitter:"], link[rel="canonical"], script[type="application/ld+json"]',
    ).forEach((node) => node.remove());
    const template = document.createElement('template');
    template.innerHTML = renderSeoHead(path);
    document.head.append(template.content);
  }, [path]);
}
