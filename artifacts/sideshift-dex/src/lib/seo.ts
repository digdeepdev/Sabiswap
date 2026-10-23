// Verified published primary URL; never use a workspace preview URL here.
export const SITE_URL = 'https://sabiswap.io';
export const SEO_PAGES = [
  { path: '/', title: 'SabiSwap — Cross-Chain Crypto Swaps Powered by SideShift', description: 'Swap crypto across blockchains with SabiSwap, powered by SideShift. Compare live quotes, choose your networks and receive crypto directly in your wallet.', index: true },
  { path: '/faq', title: 'Crypto Swap FAQ: Networks, Fees & Order Tracking | SabiSwap', description: 'Learn how SabiSwap crypto swaps work. Find answers about networks, destination addresses, fixed quotes, fees, order tracking and upcoming token claims.', index: true },
  { path: '/help', title: 'Crypto Swap Help & Troubleshooting | SabiSwap Support', description: 'Get help with SabiSwap quotes, delayed transfers, wrong networks and expired orders. Find official SideShift support and learn how to protect your order ID.', index: true },
  { path: '/brand-assets', title: 'SabiSwap Brand Assets — App Icons, Favicons & Colors', description: 'Download SabiSwap app icons, PNG and ICO favicons, and the Apple touch icon. Explore the lime and charcoal brand palette and guidelines for using the logo.', index: true },
  { path: '/terms', title: 'Terms of Service — Draft Pending Review | SabiSwap', description: 'Read the draft terms for the SabiSwap crypto swap interface, including third-party services, transaction risks and security. Pending legal review.', index: false },
];

export function pageSeo(path: string) {
  const clean = path.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  return SEO_PAGES.find((page) => page.path === clean) ?? {
    path: clean, title: 'Page Not Found | SabiSwap',
    description: 'This SabiSwap page could not be found. Return to the swap interface or visit our FAQ and help pages.', index: false,
  };
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
}

export function renderSeoHead(path: string) {
  const page = pageSeo(path);
  const url = `${SITE_URL}${page.path}`;
  const image = `${SITE_URL}/social-preview.png`;
  const graph: Record<string, unknown>[] = [{
    '@type': 'WebSite', '@id': `${SITE_URL}/#website`, name: 'SabiSwap', url: `${SITE_URL}/`,
    description: SEO_PAGES[0].description, inLanguage: 'en',
  }, {
    '@type': 'WebPage', '@id': `${url}#webpage`, url, name: page.title, description: page.description,
    isPartOf: { '@id': `${SITE_URL}/#website` }, inLanguage: 'en',
  }];
  if (page.path === '/') graph.push({
    '@type': 'WebApplication', name: 'SabiSwap', url: `${SITE_URL}/`,
    applicationCategory: 'FinanceApplication', operatingSystem: 'Web',
    description: page.description, image, browserRequirements: 'Requires JavaScript for live quotes and swaps',
  });
  if (page.path !== '/') graph.push({
    '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'SabiSwap', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: page.title.split(' | ')[0], item: url },
    ],
  });
  const tags = [
    `<title>${escapeHtml(page.title)}</title>`,
    `<meta name="description" content="${escapeHtml(page.description)}">`,
    `<meta name="robots" content="${page.index ? 'index, follow, max-image-preview:large' : 'noindex, follow'}">`,
    `<link rel="canonical" href="${escapeHtml(url)}">`,
    ...Object.entries({
      'og:title': page.title, 'og:description': page.description, 'og:url': url,
      'og:type': 'website', 'og:site_name': 'SabiSwap', 'og:locale': 'en_US',
      'og:image': image, 'og:image:width': '1200', 'og:image:height': '630',
      'og:image:alt': 'SabiSwap — cross-chain crypto swaps powered by SideShift',
    }).map(([key, value]) => `<meta property="${key}" content="${escapeHtml(value)}">`),
    ...Object.entries({
      'twitter:card': 'summary_large_image', 'twitter:site': '@sabiswap', 'twitter:title': page.title,
      'twitter:description': page.description, 'twitter:image': image,
      'twitter:image:alt': 'SabiSwap — cross-chain crypto swaps powered by SideShift',
    }).map(([key, value]) => `<meta name="${key}" content="${escapeHtml(value)}">`),
    `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')}</script>`,
  ];
  return tags.join('\n');
}

export function renderSitemap() {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${SEO_PAGES.filter((page) => page.index).map((page) => `  <url><loc>${SITE_URL}${page.path}</loc></url>`).join('\n')}\n</urlset>\n`;
}
