import { useEffect, useRef } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SwapFlow } from '@/components/swap/SwapFlow';
import { ActiveShiftTracker } from '@/components/swap/ActiveShiftTracker';
import { MarketCarousel } from '@/components/market/MarketCarousel';
import { AffiliateActivity } from '@/components/affiliate/AffiliateActivity';
import { useLocalStorage } from '@/hooks/use-local-storage';

export default function Home() {
  const [activeShiftId, setActiveShiftId] = useLocalStorage<string | null>('sideshift-active-shift-id', null);

  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('sabiswap-theme', 'light');
  const swapRef = useRef<HTMLDivElement>(null);
  const marketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const goTo = (el: HTMLElement | null) => {
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    el.focus({ preventScroll: true });
  };

  useEffect(() => {
    const id = window.location.hash.replace('#', '');
    if (id !== 'swap' && id !== 'market') return;
    const t = window.setTimeout(() => goTo(document.getElementById(id)), 50);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-background">
      <Header
        isDark={theme === 'dark'}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onMarket={() => goTo(marketRef.current)}
        onSwap={() => goTo(swapRef.current)}
      />
    <main className="flex-1 w-full flex flex-col items-center justify-center p-4 py-8 md:py-10 relative overflow-hidden bg-background">
      {/* Abstract technical grid background */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
        style={{
          backgroundImage: `radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />
      
      <div className="z-10 w-full max-w-4xl flex flex-col items-center gap-8">
        <div className="sr-only">
          <h1>SabiSwap — Cross-chain crypto swaps</h1>
        </div>
        <div id="swap" ref={swapRef} tabIndex={-1} className="w-full flex flex-col items-center scroll-mt-24 outline-none">
        {activeShiftId ? (
          <ActiveShiftTracker 
            shiftId={activeShiftId} 
            onClear={() => setActiveShiftId(null)} 
          />
        ) : (
          <SwapFlow 
            onShiftCreated={(id) => setActiveShiftId(id)} 
          />
        )}
        </div>
        
        <div id="market" ref={marketRef} tabIndex={-1} className="w-full mt-8 scroll-mt-24 outline-none">
          <MarketCarousel />
        </div>

        <div id="affiliate" className="w-full mt-4 scroll-mt-24">
          <AffiliateActivity />
        </div>

        <details className="w-full rounded-2xl border border-border bg-card px-5 py-4 text-sm" data-testid="homepage-about">
          <summary className="cursor-pointer rounded font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            About SabiSwap
          </summary>
          <div className="mt-4 space-y-4 leading-relaxed text-muted-foreground">
            <h2 className="text-base font-semibold text-foreground">Multi-chain crypto swaps powered by SideShift</h2>
            <p>
              SabiSwap is a multi-chain cryptocurrency exchange interface powered by SideShift.
              Swap crypto across blockchains, compare live quotes, and receive your chosen asset
              directly in your wallet without creating a SabiSwap account.
            </p>
            <p>
              Explore assets on networks including Bitcoin, Ethereum, Solana, Arbitrum, Base,
              BNB Smart Chain, Polygon, Avalanche, Optimism, Sui, TON and TRON.
              Available assets, networks and swap limits depend on SideShift and can change;
              check the live asset selector before sending funds.
            </p>
            <h2 className="text-base font-semibold text-foreground">How to swap crypto across blockchains</h2>
            <p>
              Choose the asset and network you want to send and receive, enter an amount,
              review the quote, and provide a destination wallet address on the receiving network.
              After confirming the swap, send funds to the deposit address shown and track
              the order status. SideShift processes the exchange; network fees, timing and
              regional restrictions may apply.
            </p>
            <p>
              Read the <a href={`${import.meta.env.BASE_URL}faq`} className="underline underline-offset-4">crypto swap FAQ</a>{' '}
              for network, fee and order-tracking guidance, or visit{' '}
              <a href={`${import.meta.env.BASE_URL}help`} className="underline underline-offset-4">swap support</a>{' '}
              if you need help.
            </p>
          </div>
        </details>
      </div>
    </main>
    <Footer onSwap={() => goTo(swapRef.current)} />
    </div>
  );
}
