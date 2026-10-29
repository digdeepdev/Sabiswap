import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist/public');
const shell = await readFile(path.join(output, 'index.html'), 'utf8');
const server = await createServer({
  root, mode: 'production',
  server: { middlewareMode: true, hmr: false, watch: null },
  appType: 'custom',
});

try {
  const { render, SEO_PAGES, renderSeoHead } = await server.ssrLoadModule('/src/entry-prerender.tsx');
  for (const route of [...SEO_PAGES, { path: '/404' }]) {
    const markup = render(route.path);
    const html = shell
      .replace(/<!--seo:start-->[\s\S]*?<!--seo:end-->/, `<!--seo:start-->\n${renderSeoHead(route.path)}\n<!--seo:end-->`)
      .replace('<div id="root"></div>', () => `<div id="root">${markup}</div>`);
    if (!html.includes('<h1') || !html.includes('rel="canonical"')) {
      throw new Error(`Missing pre-rendered content or canonical URL: ${route.path}`);
    }
    const target = route.path === '/404'
      ? path.join(output, '404.html')
      : path.join(output, route.path === '/' ? '' : route.path.slice(1), 'index.html');
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, html);
    console.log(`Pre-rendered ${route.path}`);
  }
  // Dynamic pair routes share a noindex loading shell; the client validates the
  // requested assets against SideShift before showing or quoting the pair.
  const pairHtml = shell
    .replace(/<!--seo:start-->[\s\S]*?<!--seo:end-->/, `<!--seo:start-->\n${renderSeoHead('/', true)}\n<!--seo:end-->`)
    .replace('<div id="root"></div>', () => `<div id="root">${render('/eth/sol')}</div>`);
  await writeFile(path.join(output, 'pair.html'), pairHtml);
  console.log('Pre-rendered dynamic pair shell');
} finally {
  await server.close();
}
