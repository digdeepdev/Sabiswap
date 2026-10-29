import React, { useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useListSideShiftCoins, useCreateSideShiftQuote, useCreateSideShiftFixedShift, SideShiftQuote } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CoinSelector } from './CoinSelector';
import { useDebounce } from '@/hooks/use-local-storage';
import { toast } from '@/hooks/use-toast';
import { RefreshCcw, ArrowDown, Link as LinkIcon } from 'lucide-react';
import { readSwapPair, writeSwapPair, type SwapPair } from '@/lib/swap-pair';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Gift } from 'lucide-react';

interface SwapFlowProps {
  onShiftCreated: (shiftId: string) => void;
}

export function SwapFlow({ onShiftCreated }: SwapFlowProps) {
  const [location, navigate] = useLocation();
  const search = useSearch();
  const { data: coins, isLoading: coinsLoading } = useListSideShiftCoins();
  const createQuote = useCreateSideShiftQuote();
  const createShift = useCreateSideShiftFixedShift();

  const [depositCoin, setDepositCoin] = useState<string>('');
  const [depositNetwork, setDepositNetwork] = useState<string>('');
  const [settleCoin, setSettleCoin] = useState<string>('');
  const [settleNetwork, setSettleNetwork] = useState<string>('');
  const [depositAmount, setDepositAmount] = useState<string>('0.001');
  const [settleAddress, setSettleAddress] = useState<string>('');
  const [pairLinkError, setPairLinkError] = useState<string | null>(null);
  
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

  const applyPair = (pair: SwapPair) => {
    setDepositCoin(pair.depositCoin);
    setDepositNetwork(pair.depositNetwork);
    setSettleCoin(pair.settleCoin);
    setSettleNetwork(pair.settleNetwork);
    setQuote(null);
    setQuoteError(null);
  };

  const updatePair = (pair: SwapPair) => {
    applyPair(pair);
    setPairLinkError(null);
    if (pair.settleCoin !== settleCoin || pair.settleNetwork !== settleNetwork) setSettleAddress('');
    if (!pair.depositCoin || !pair.depositNetwork || !pair.settleCoin || !pair.settleNetwork) return;
    const url = writeSwapPair(new URL(window.location.href), pair, coins, import.meta.env.BASE_URL);
    const relative = url.pathname.slice(import.meta.env.BASE_URL.replace(/\/$/, '').length) + url.search + url.hash;
    navigate(relative, { replace: true });
  };

  // Resolve direct visits, legacy links and browser navigation using exact API identifiers.
  useEffect(() => {
    if (!coins?.length) return;

    try {
      const pair = readSwapPair(window.location.search, coins, window.location.pathname, import.meta.env.BASE_URL);
      if (pair) {
        applyPair(pair);
        setSettleAddress('');
        setPairLinkError(null);
        return;
      }
    } catch (error) {
      applyPair({ depositCoin: '', depositNetwork: '', settleCoin: '', settleNetwork: '' });
      setPairLinkError(error instanceof Error ? error.message : 'Invalid swap link.');
      return;
    }

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
  }, [coins, location, search]);

  const copyPairLink = async () => {
    const url = writeSwapPair(new URL(import.meta.env.BASE_URL, window.location.origin), {
      depositCoin, depositNetwork, settleCoin, settleNetwork,
    }, coins, import.meta.env.BASE_URL);
    try {
      await navigator.clipboard.writeText(url.toString());
      toast({ title: 'Pair link copied', description: 'Share it to open these assets and networks.' });
    } catch {
      toast({ title: 'Could not copy link', description: 'Copy the pair link from your browser’s address bar.', variant: 'destructive' });
    }
  };

  // Poll for quote updates dynamically
  useEffect(() => {
    let active = true;
    setQuote(null);
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
    updatePair({
      depositCoin: settleCoin, depositNetwork: settleNetwork,
      settleCoin: depositCoin, settleNetwork: depositNetwork,
    });
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
        <Tabs defaultValue="swap">
        <div className="bg-foreground text-background px-4 sm:px-6 py-4 flex justify-between items-center gap-3">
          <TabsList aria-label="Swap and rewards" className="h-12 rounded-full bg-background/10 p-1 gap-1">
            {['Swap', 'Claim'].map((label) => (
              <TabsTrigger
                key={label}
                value={label.toLowerCase()}
                className="h-10 rounded-full px-5 sm:px-6 font-bold text-base text-background/60 border border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none hover:text-background focus-visible:ring-primary"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex gap-2 font-mono">
            <span className="w-3 h-3 rounded-full bg-secondary animate-pulse" />
            <span className="text-xs text-background/70 leading-none self-center">LIVE</span>
          </div>
        </div>

        <TabsContent value="swap" forceMount className="mt-0 data-[state=inactive]:hidden">
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={copyPairLink}
              disabled={!depositCoin || !depositNetwork || !settleCoin || !settleNetwork}
            >
              <LinkIcon className="mr-2 h-4 w-4" aria-hidden="true" />
              Copy pair link
            </Button>
          </div>
          {pairLinkError && <p role="alert" className="text-sm text-destructive">{pairLinkError}</p>}
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
                onSelect={(c, n) => updatePair({ depositCoin: c, depositNetwork: n, settleCoin, settleNetwork })}
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
              <Label className="font-mono text-primary-ink uppercase text-xs font-bold tracking-wider">You Receive</Label>
              {isQuoting && <RefreshCcw className="w-3 h-3 text-primary-ink animate-spin" />}
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
                onSelect={(c, n) => updatePair({ depositCoin, depositNetwork, settleCoin: c, settleNetwork: n })}
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
            {createShift.isPending ? "CREATING SHIFT..." : "Confirm Swap"}
          </Button>

        </CardContent>
        </TabsContent>
        <TabsContent value="claim" className="mt-0">
          <CardContent className="px-6 py-12 text-center flex flex-col items-center gap-5">
            <div className="rounded-2xl border border-primary/30 bg-primary/10 p-5">
              <Gift className="h-9 w-9 text-primary-ink" aria-hidden="true" />
            </div>
            <span className="rounded-full bg-primary/15 border border-primary/30 px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-primary-ink">
              Coming soon
            </span>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold">Rewards &amp; airdrops</h2>
              <p className="max-w-xs text-sm text-muted-foreground leading-relaxed">
                Token claims aren’t available yet. Claim details and eligibility will be announced when rewards are ready.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">No wallet connection or transaction is required.</p>
          </CardContent>
        </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
