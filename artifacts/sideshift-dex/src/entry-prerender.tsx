import { renderToString } from 'react-dom/server';
import App from './App';
export { SEO_PAGES, renderSeoHead } from './lib/seo';

// Build-time rendering never sends funds, fetches quotes or reads visitor storage.
// The normal client entry mounts the interactive app over this initial HTML.
export function render(path: string) {
  return renderToString(<App ssrPath={path} />);
}
