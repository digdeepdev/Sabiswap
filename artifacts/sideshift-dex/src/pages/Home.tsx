import React from 'react';
import { SwapFlow } from '@/components/swap/SwapFlow';
import { ActiveShiftTracker } from '@/components/swap/ActiveShiftTracker';
import { MarketCarousel } from '@/components/market/MarketCarousel';
import { useLocalStorage } from '@/hooks/use-local-storage';

export default function Home() {
  const [activeShiftId, setActiveShiftId] = useLocalStorage<string | null>('sideshift-active-shift-id', null);

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-4 py-8 md:py-10 relative overflow-hidden bg-background">
      {/* Abstract technical grid background */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
        style={{
          backgroundImage: `radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />
      
      <div className="z-10 w-full max-w-4xl flex flex-col items-center gap-8">
        {/* Header */}
        <header className="relative flex items-center justify-center mb-2">
          <h1 className="sr-only">SabiSwap</h1>
          <div aria-hidden="true" className="absolute inset-0 rounded-full bg-primary/20 blur-2xl" />
          <img
            src={`${import.meta.env.BASE_URL}favicon.svg`}
            alt=""
            width={88}
            height={88}
            className="relative h-20 w-20 md:h-[88px] md:w-[88px] rounded-[25%] shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.45)] transition-transform duration-200 hover:-translate-y-1 hover:rotate-3 motion-reduce:transform-none motion-reduce:transition-none"
          />
        </header>

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
        
        <div className="w-full mt-8">
          <MarketCarousel />
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-xs font-mono text-muted-foreground uppercase tracking-widest">
          No Accounts. No Custody. 200+ Assets.
        </div>
      </div>
    </div>
  );
}
