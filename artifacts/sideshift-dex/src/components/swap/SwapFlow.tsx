import React, { useState, useEffect, useRef } from 'react';
import { useListSideShiftCoins, useCreateSideShiftQuote, useCreateSideShiftFixedShift, SideShiftQuote } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CoinSelector } from './CoinSelector';
import { useDebounce } from '@/hooks/use-local-storage';
import { toast } from '@/hooks/use-toast';
import { RefreshCcw, ArrowDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface SwapFlowProps {
  onShiftCreated: (shiftId: string) => void;
}

export function SwapFlow({ onShiftCreated }: SwapFlowProps) {
  const { data: coins, isLoading: coinsLoading } = useListSideShiftCoins();
  const createQuote = useCreateSideShiftQuote();
  const createShift = useCreateSideShiftFixedShift();

  const [depositCoin, setDepositCoin] = useState<string>('');
  const [depositNetwork, setDepositNetwork] = useState<string>('');
  const [settleCoin, setSettleCoin] = useState<string>('');
  const [settleNetwork, setSettleNetwork] = useState<string>('');
  const [depositAmount, setDepositAmount] = useState<string>('0.001');
  const [settleAddress, setSettleAddress] = useState<string>('');
  const initialized = useRef(false);
  
  const debouncedAmount = useDebounce(depositAmount, 600);
  const [quote, setQuote] = useState<SideShiftQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const getErrorMessage = (error: unknown): string => {
    if (!error || typeof error !== 'object') return 'Quote unavailable';
    const value = error as {
      message?: string;
      data?: { error?: string };
    };
    return value.data?.error ?? value.message ?? 'Quote unavailable';
  };

  // Initialize with a common pair while preserving the API's exact identifiers.
  useEffect(() => {
    if (!coins?.length || initialized.current) return;

    const bitcoin =
      coins.find((coin) => coin.coin.toLowerCase() === 'btc') ?? coins[0];
    const ethereum =
      coins.find((coin) => coin.coin.toLowerCase() === 'eth') ??
      coins.find((coin) => coin.coin !== bitcoin.coin) ??
      coins[0];

    setDepositCoin(bitcoin.coin);
    setDepositNetwork(
      bitcoin.networks.find((network) => network === 'bitcoin') ??
        bitcoin.networks[0] ??
        '',
    );
    setSettleCoin(ethereum.coin);
    setSettleNetwork(
      ethereum.networks.find((network) => network === 'ethereum') ??
        ethereum.networks[0] ??
        '',
    );
    initialized.current = true;
  }, [coins]);

  // Poll for quote updates dynamically
  useEffect(() => {
    let active = true;
    if (debouncedAmount && Number(debouncedAmount) > 0 && depositCoin && depositNetwork && settleCoin && settleNetwork) {
      createQuote.mutate({
        data: {
          depositCoin,
          depositNetwork,
          settleCoin,
          settleNetwork,
          depositAmount: debouncedAmount
        }
      }, {
        onSuccess: (data) => {
          if (active) {
            setQuote(data);
            setQuoteError(null);
          }
        },
        onError: (error) => {
          if (active) {
            setQuote(null);
            setQuoteError(getErrorMessage(error));
          }
        }
      });
    } else {
      setQuote(null);
      setQuoteError(null);
    }
    return () => { active = false; };
  }, [debouncedAmount, depositCoin, depositNetwork, settleCoin, settleNetwork]);

  const handleSwapCoins = () => {
    const dc = depositCoin;
    const dn = depositNetwork;
    setDepositCoin(settleCoin);
    setDepositNetwork(settleNetwork);
    setSettleCoin(dc);
    setSettleNetwork(dn);
  };

  const handleConfirm = () => {
    if (!quote) return;
    if (!settleAddress.trim()) {
      toast({
        title: "Address Required",
        description: "Please enter a valid destination address.",
        variant: "destructive"
      });
      return;
    }

    createShift.mutate({
      data: {
        quoteId: quote.id,
        settleAddress: settleAddress.trim()
      }
    }, {
      onSuccess: (shift) => {
        onShiftCreated(shift.id);
      },
      onError: (err) => {
        toast({
          title: "Shift Creation Failed",
          description: getErrorMessage(err),
          variant: "destructive"
        });
      }
    });
  };

  if (coinsLoading || !coins) {
    return (
      <Card className="w-full max-w-md mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </Card>
    );
  }

  const isQuoting = createQuote.isPending;

  return (
    <div className="w-full max-w-[480px] mx-auto relative group">
      {/* Decorative background element */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary via-secondary to-primary rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
      
      <Card className="relative w-full border-4 border-foreground shadow-[8px_8px_0px_0px_hsl(var(--foreground))] rounded-xl bg-card overflow-hidden">
        <div className="bg-foreground text-background px-6 py-4 font-mono font-bold flex justify-between items-center tracking-widest text-lg">
          <span>SabiSwap</span>
          <div className="flex gap-2">
            <span className="w-3 h-3 rounded-full bg-secondary animate-pulse" />
            <span className="text-xs text-background/70 leading-none self-center">LIVE</span>
          </div>
        </div>

        <CardContent className="p-6 space-y-4">
          {/* DEPOSIT SECTION */}
          <div className="space-y-3 bg-muted/40 p-4 rounded-lg border-2 border-foreground/10">
            <div className="flex justify-between items-end">
              <Label className="font-mono text-muted-foreground uppercase text-xs font-bold tracking-wider">You Send</Label>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <Input 
                type="number" 
                value={depositAmount} 
                onChange={(e) => setDepositAmount(e.target.value)}
                className="text-3xl font-bold bg-transparent border-none shadow-none h-14 p-0 focus-visible:ring-0 w-full sm:w-1/2 rounded-none placeholder:text-muted"
                placeholder="0.00"
              />
              <CoinSelector 
                coins={coins}
                selectedCoin={depositCoin}
                selectedNetwork={depositNetwork}
                onSelect={(c, n) => { setDepositCoin(c); setDepositNetwork(n); }}
              />
            </div>
          </div>

          {/* SWAP BUTTON */}
          <div className="relative flex justify-center -my-3 z-10">
            <Button 
              size="icon" 
              variant="outline" 
              className="rounded-full w-10 h-10 border-2 bg-background hover:bg-accent text-foreground hover:scale-110 transition-transform duration-200 hover:rotate-180"
              onClick={handleSwapCoins}
            >
              <ArrowDown className="w-5 h-5" />
            </Button>
          </div>

          {/* SETTLE SECTION */}
          <div className="space-y-3 bg-primary/5 p-4 rounded-lg border-2 border-primary/20">
            <div className="flex justify-between items-end">
              <Label className="font-mono text-primary uppercase text-xs font-bold tracking-wider">You Receive</Label>
              {isQuoting && <RefreshCcw className="w-3 h-3 text-primary animate-spin" />}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="text-3xl font-bold h-14 flex items-center w-full sm:w-1/2 text-foreground/80 overflow-hidden">
                {quote ? (
                  <span className="truncate">{Number(quote.settleAmount).toFixed(6)}</span>
                ) : (
                  <span className="text-muted-foreground/30">0.00</span>
                )}
              </div>
              <CoinSelector 
                coins={coins}
                selectedCoin={settleCoin}
                selectedNetwork={settleNetwork}
                onSelect={(c, n) => { setSettleCoin(c); setSettleNetwork(n); }}
              />
            </div>
            
            {quote && (
              <div className="flex justify-between text-xs font-mono text-muted-foreground pt-2 border-t border-foreground/5 mt-2">
                <span>Rate</span>
                <span className="text-foreground">1 {depositCoin.toUpperCase()} = {quote.rate} {settleCoin.toUpperCase()}</span>
              </div>
            )}
            {quoteError && !isQuoting && (
              <p className="border-t border-foreground/10 pt-2 text-xs font-mono text-destructive">
                {quoteError}
              </p>
            )}
          </div>

          {/* ADDRESS INPUT */}
          <div className="space-y-3 pt-2">
            <Label className="font-mono font-bold tracking-wider text-sm uppercase">Destination Address</Label>
            <Input 
              placeholder={`Enter ${settleCoin.toUpperCase()} Address`} 
              value={settleAddress}
              onChange={(e) => setSettleAddress(e.target.value)}
              className="font-mono text-sm h-12"
            />
          </div>

          <Button 
            className="w-full h-14 mt-4 font-mono text-lg tracking-wider font-bold"
            disabled={!quote || createShift.isPending || !settleAddress}
            onClick={handleConfirm}
          >
            {createShift.isPending ? "CREATING SHIFT..." : "CONFIRM SHIFT"}
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}
