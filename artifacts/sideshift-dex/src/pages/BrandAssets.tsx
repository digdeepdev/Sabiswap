import { useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import { PageLayout, cardCls } from '@/components/PageLayout';

const B = import.meta.env.BASE_URL;
const files = [
  { id: 'app-icon', file: 'app-icon.png', name: 'sabiswap-app-icon-512.png', t: 'App icon', d: '512 px PNG, transparent background', dark: false },
  { id: 'favicon-png', file: 'favicon.png', name: 'sabiswap-favicon-64.png', t: 'Favicon PNG', d: '64 px PNG, dark background', dark: true },
  { id: 'apple', file: 'apple-touch-icon.png', name: 'sabiswap-apple-touch-icon-180.png', t: 'Apple touch icon', d: '180 px PNG, dark background', dark: true },
  { id: 'ico', file: 'favicon.ico', name: 'sabiswap-favicon.ico', t: 'Favicon ICO', d: 'Multi-size ICO', dark: true },
];
const palette = [
  { n: 'Black', hex: '#10120d', fg: '#eef3e4' },
  { n: 'Lime', hex: '#b9e66a', fg: '#11150c' },
  { n: 'Green', hex: '#8fd94e', fg: '#11150c' },
  { n: 'White', hex: '#ffffff', fg: '#11150c' },
];

function Swatch({ n, hex, fg }: { n: string; hex: string; fg: string }) {
  const [state, setState] = useState<'idle' | 'ok' | 'err'>('idle');
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(hex);
      setState('ok');
    } catch {
      setState('err');
    }
    setTimeout(() => setState('idle'), 2000);
  };
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card" data-testid={`swatch-${n.toLowerCase()}`}>
      <div className="h-20" style={{ backgroundColor: hex }} />
      <div className="flex items-center justify-between gap-2 p-3">
        <div>
          <p className="text-sm font-bold">{n}</p>
          <p className="font-mono text-xs text-muted-foreground">{hex}</p>
        </div>
        <button type="button" onClick={copy} aria-label={`Copy ${n} hex ${hex}`} data-testid={`button-copy-${n.toLowerCase()}`} className="grid h-9 w-9 place-items-center rounded-xl border border-border hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {state === 'ok' ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
      <p role="status" className={`px-3 pb-3 text-xs ${state === 'err' ? 'text-destructive' : 'text-muted-foreground'} ${state === 'idle' ? 'sr-only' : ''}`}>
        {state === 'ok' ? 'Copied' : state === 'err' ? 'Copy failed. Select the hex value manually.' : ''}
      </p>
    </div>
  );
}

export default function BrandAssets() {
  return (
    <PageLayout
      title="Brand Assets | SabiSwap"
      description="Download the SabiSwap app icon, favicons and Apple touch icon, and see the brand colors and usage notes."
      eyebrow="Resources"
      heading="Brand assets"
      intro="The icon files used by this app, each downloadable as-is."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {files.map((f) => (
          <section key={f.id} className={cardCls} data-testid={`card-asset-${f.id}`}>
            <div className={`mb-4 grid h-36 place-items-center rounded-xl border border-border ${f.dark ? 'bg-[#10120d]' : 'bg-[#1b1d19]'}`}>
              {f.file.endsWith('.ico') ? (
                <p className="font-mono text-xs text-[#c9d2bb]">favicon.ico</p>
              ) : (
                <img src={`${B}${f.file}`} alt={`${f.t} preview`} className="max-h-24 max-w-24 object-contain" />
              )}
            </div>
            <h2 className="font-bold">{f.t}</h2>
            <p className="mb-3 text-sm text-muted-foreground">{f.d}</p>
            <a href={`${B}${f.file}`} download={f.name} data-testid={`link-download-${f.id}`} className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-br from-[#c9e66a] to-[#8fd94e] px-5 text-sm font-bold text-[#11150c] shadow-[0_3px_0_#5f9a2c] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Download className="h-4 w-4" aria-hidden="true" /> Download {f.name}
            </a>
          </section>
        ))}
      </div>

      <h2 className="mb-4 mt-12 text-2xl font-bold">Colors</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {palette.map((p) => <Swatch key={p.hex} {...p} />)}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Lime is approximate.</p>

      <section className={`${cardCls} mt-10`}>
        <h2 className="mb-3 text-lg font-bold">Usage notes</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-[15px] text-muted-foreground">
          <li>Keep the icon shape and colors unchanged.</li>
          <li>Place it on a background where it stays clearly readable.</li>
          <li>Do not use it in a way that implies SabiSwap endorses or partners with you.</li>
          <li>No trademark permission beyond these notes is granted or implied here.</li>
        </ul>
      </section>
    </PageLayout>
  );
}
