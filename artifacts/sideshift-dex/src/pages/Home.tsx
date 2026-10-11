import { useEffect, useRef } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SwapFlow } from '@/components/swap/SwapFlow';
import { ActiveShiftTracker } from '@/components/swap/ActiveShiftTracker';
import { MarketCarousel } from '@/components/market/MarketCarousel';
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

  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-background">
      <Header
        isDark={theme === 'dark'}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onMarket={() => goTo(marketRef.current)}
        onSwap={() => goTo(swapRef.current)}
      />
    <div className="flex-1 w-full flex flex-col items-center justify-center p-4 py-8 md:py-10 relative overflow-hidden bg-background">
      {/* Abstract technical grid background */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
        style={{
          backgroundImage: `radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />
      
      <div className="z-10 w-full max-w-4xl flex flex-col items-center gap-8">
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
      </div>
    </div>
    <Footer onSwap={() => goTo(swapRef.current)} />
    </div>
  );
}
