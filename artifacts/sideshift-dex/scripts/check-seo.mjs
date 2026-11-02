import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const output = new URL('../dist/public/', import.meta.url);
const routes = ['/', '/faq', '/help', '/brand-assets', '/terms', '/claim', '/campaign-admin'];
const titles = new Set();
for (const route of routes) {
  const file = route === '/' ? 'index.html' : `${route.slice(1)}/index.html`;
  const html = await readFile(new URL(file, output), 'utf8');
  const head = html.split('</head>')[0];
  const title = head.match(/<title>(.*?)<\/title>/)?.[1];
  assert(title && !titles.has(title), `Unique title: ${route}`);
  titles.add(title);
  assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1, `One H1: ${route}`);
  assert(head.includes(`rel="canonical" href="https://sabiswap.io${route}"`), `Canonical: ${route}`);
  assert(head.includes(`property="og:url" content="https://sabiswap.io${route}"`), `OG URL: ${route}`);
  assert(head.includes('https://sabiswap.io/social-preview.png'), `Share image: ${route}`);
  assert(head.includes('name="description"'), `Description: ${route}`);
  const schema = head.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  assert.equal(JSON.parse(schema)['@context'], 'https://schema.org', `Valid schema: ${route}`);
  assert(!head.includes('.replit.dev'), `No development URLs: ${route}`);
  assert(head.includes(['/terms', '/campaign-admin'].includes(route) ? 'noindex, follow' : 'index, follow'), `Robots: ${route}`);
  if (route === '/faq') {
    assert.equal((html.match(/<details[\s>]/g) ?? []).length, 10, 'All FAQ entries pre-rendered');
    assert(html.includes('including the memo if one is displayed'), 'FAQ answer readable without JS');
  }
  for (const destination of ['/faq', '/help', '/terms', '/brand-assets']) {
    assert(html.includes(`href="${destination}"`), `Internal footer link ${destination}: ${route}`);
  }
  console.log(`SEO checks passed: ${route}`);
}
const sitemap = await readFile(new URL('sitemap.xml', output), 'utf8');
assert(!sitemap.includes('/terms'), 'Draft terms excluded from sitemap');
assert(!sitemap.includes('/campaign-admin'), 'Private admin excluded from sitemap');
assert.equal((sitemap.match(/<loc>/g) ?? []).length, 5, 'All indexable pages in sitemap');
const robots = await readFile(new URL('robots.txt', output), 'utf8');
assert(robots.includes('Sitemap: https://sabiswap.io/sitemap.xml'));
const notFound = await readFile(new URL('404.html', output), 'utf8');
assert(notFound.includes('noindex, follow'), 'Unknown routes noindex');
const image = await readFile(new URL('social-preview.png', output));
assert.equal(image.readUInt32BE(16), 1200);
assert.equal(image.readUInt32BE(20), 630);
console.log('Sitemap, robots, fallback and 1200×630 social image checks passed.');
