import React from 'react';
import { SwapFlow } from '@/components/swap/SwapFlow';
import { ActiveShiftTracker } from '@/components/swap/ActiveShiftTracker';
import { MarketCarousel } from '@/components/market/MarketCarousel';
import { useLocalStorage } from '@/hooks/use-local-storage';

export default function Home() {
  const [activeShiftId, setActiveShiftId] = useLocalStorage<string | null>('sideshift-active-shift-id', null);

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-4 py-12 relative overflow-hidden bg-background">
      {/* Abstract technical grid background */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
        style={{
          backgroundImage: `radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />
      
      <div className="z-10 w-full max-w-4xl flex flex-col items-center gap-8">
        {/* Header */}
        <div className="text-center space-y-3 mb-4">
          <h1 className="text-4xl md:text-6xl font-bold font-mono tracking-tighter text-foreground bg-clip-text">
            Sabi<span className="text-primary">Swap</span>
          </h1>
          <p className="font-mono text-muted-foreground text-sm md:text-base tracking-widest uppercase">
            Direct-to-Wallet Cross-Chain Swaps
          </p>
        </div>

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
