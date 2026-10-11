import { useEffect } from 'react';

const SELECTORS = [
  'meta[name="description"]',
  'meta[property="og:title"]',
  'meta[property="og:description"]',
  'meta[name="twitter:title"]',
  'meta[name="twitter:description"]',
];

let originalTitle: string | null = null;
const originals = new Map<string, string | null>();

function capture() {
  if (originalTitle !== null) return;
  originalTitle = document.title;
  SELECTORS.forEach((s) => originals.set(s, document.head.querySelector(s)?.getAttribute('content') ?? null));
}

function setMeta(selector: string, value: string) {
  document.head.querySelector(selector)?.setAttribute('content', value);
}

export function usePageMeta(title: string, description: string) {
  useEffect(() => {
    capture();
    document.title = title;
    setMeta('meta[name="description"]', description);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', description);
    return () => {
      if (originalTitle !== null) document.title = originalTitle;
      originals.forEach((v, s) => {
        if (v !== null) setMeta(s, v);
      });
    };
  }, [title, description]);
}
