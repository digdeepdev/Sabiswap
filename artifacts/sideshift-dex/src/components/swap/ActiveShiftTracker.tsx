import React, { useEffect, useState } from 'react';
import {
  getGetSideShiftShiftQueryKey,
  useGetSideShiftShift,
} from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Copy, ExternalLink, ArrowRight, Clock, CheckCircle2, AlertCircle, RefreshCcw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ActiveShiftTrackerProps {
  shiftId: string;
  onClear: () => void;
}

export function ActiveShiftTracker({ shiftId, onClear }: ActiveShiftTrackerProps) {
  const [copying, setCopying] = useState(false);
  
  const { data: shift, isLoading, isError, error, refetch } = useGetSideShiftShift(shiftId, {
    query: {
      enabled: !!shiftId,
      queryKey: getGetSideShiftShiftQueryKey(shiftId),
      refetchInterval: (query) => {
        // Stop polling if settled or refunded
        const state = query.state.data?.status;
        if (state === 'settled' || state === 'refunded' || state === 'expired') {
          return false;
        }
        return 5000;
      }
    }
  });

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopying(true);
    toast({ title: `Copied ${type}` });
    setTimeout(() => setCopying(false), 1000);
  };

  if (isLoading || !shift) {
    return (
      <Card className="w-full max-w-[480px] mx-auto p-6 border-4 border-foreground shadow-[8px_8px_0px_0px_hsl(var(--foreground))]">
        <div className="flex items-center gap-4 text-primary-ink font-mono font-bold animate-pulse mb-6 text-lg">
          <RefreshCcw className="w-5 h-5 animate-spin" />
          LOCATING SHIFT...
        </div>
        <Skeleton className="h-24 w-full mb-4" />
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-12 w-full" />
      </Card>
    );
  }

  const isPending = ['waiting', 'pending', 'processing'].includes(shift.status);
  const isSettled = shift.status === 'settled';
  const isExpired = shift.status === 'expired';

  let statusColor = "bg-primary text-primary-foreground";
  if (isSettled) statusColor = "bg-secondary text-secondary-foreground";
  if (isExpired) statusColor = "bg-destructive text-destructive-foreground";

  return (
    <div className="w-full max-w-[480px] mx-auto">
      <Card className="w-full border-4 border-foreground shadow-[8px_8px_0px_0px_hsl(var(--foreground))] rounded-xl bg-card overflow-hidden">
        <div className={`px-6 py-4 font-mono font-bold flex justify-between items-center tracking-widest text-lg ${statusColor}`}>
          <span>STATUS: {shift.status.toUpperCase()}</span>
          {isPending && <RefreshCcw className="w-4 h-4 animate-spin opacity-80" />}
          {isSettled && <CheckCircle2 className="w-5 h-5 opacity-80" />}
          {isExpired && <AlertCircle className="w-5 h-5 opacity-80" />}
        </div>

        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between text-xl font-bold font-mono">
            <div className="flex flex-col items-center">
              <span className="text-sm text-muted-foreground mb-1">DEPOSIT</span>
              <span>{Number(shift.depositAmount || 0).toFixed(4)} <span className="text-sm">{shift.depositCoin.toUpperCase()}</span></span>
            </div>
            <ArrowRight className="w-6 h-6 text-muted-foreground" />
            <div className="flex flex-col items-center">
              <span className="text-sm text-muted-foreground mb-1">RECEIVE</span>
              <span className="text-primary-ink">{Number(shift.settleAmount || 0).toFixed(4)} <span className="text-sm">{shift.settleCoin.toUpperCase()}</span></span>
            </div>
          </div>

          {shift.status === 'waiting' && (
            <div className="bg-muted p-5 rounded-lg border-2 border-dashed border-foreground/20 space-y-4">
              <div className="text-center font-mono space-y-1">
                <p className="text-sm text-muted-foreground font-bold tracking-wider">SEND EXACTLY</p>
                <p className="text-3xl font-bold text-foreground bg-background py-2 rounded-md border-2 border-foreground inline-block px-4">
                  {shift.depositAmount} {shift.depositCoin.toUpperCase()}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground font-mono uppercase">To Address ({shift.depositNetwork.toUpperCase()})</p>
                <div className="flex gap-2">
                  <div className="bg-background border-2 border-foreground rounded-md p-3 font-mono text-sm break-all flex-1 select-all">
                    {shift.depositAddress}
                  </div>
                  <Button size="icon" variant="outline" className="h-auto w-12 shrink-0" onClick={() => handleCopy(shift.depositAddress, 'Address')}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {shift.depositMemo && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground font-mono uppercase">With Memo / Tag (REQUIRED)</p>
                  <div className="flex gap-2">
                    <div className="bg-accent text-accent-foreground font-bold border-2 border-foreground rounded-md p-3 font-mono text-sm break-all flex-1 select-all">
                      {shift.depositMemo}
                    </div>
                    <Button size="icon" variant="outline" className="h-auto w-12 shrink-0" onClick={() => handleCopy(shift.depositMemo!, 'Memo')}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {isSettled && (
             <div className="bg-secondary/10 p-5 rounded-lg border-2 border-secondary space-y-2 text-center">
               <CheckCircle2 className="w-12 h-12 text-primary-ink mx-auto mb-2" />
               <h3 className="font-bold text-xl text-foreground font-mono">EXCHANGE COMPLETE</h3>
               <p className="text-sm font-mono text-muted-foreground">
                 Funds sent to {shift.settleAddress.substring(0,6)}...{shift.settleAddress.slice(-4)}
               </p>
             </div>
          )}

          <div className="pt-4 border-t-2 border-foreground/10 space-y-3 font-mono text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Order ID</span>
              <span className="font-bold text-foreground">{shift.id}</span>
            </div>
            <div className="flex justify-between">
              <span>Rate</span>
              <span className="font-bold text-foreground">{shift.rate ? `1 ${shift.depositCoin.toUpperCase()} = ${shift.rate} ${shift.settleCoin.toUpperCase()}` : 'Fixing...'}</span>
            </div>
            {shift.expiresAt && !isSettled && (
              <div className="flex justify-between items-center text-destructive font-bold">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> Expires</span>
                <span>{new Date(shift.expiresAt).toLocaleTimeString()}</span>
              </div>
            )}
          </div>

          <Button 
            variant={isSettled || isExpired ? "default" : "outline"} 
            className="w-full h-12 font-mono font-bold tracking-widest uppercase mt-4" 
            onClick={onClear}
          >
            {isSettled || isExpired ? "START NEW SWAP" : "CANCEL / RETURN"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
