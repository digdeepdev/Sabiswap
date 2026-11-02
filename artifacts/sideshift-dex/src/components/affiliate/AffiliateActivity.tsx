import { getGetAffiliateActivityQueryKey, useGetAffiliateActivity, type AffiliateTransaction } from '@workspace/api-client-react';
import { ArrowRight, RefreshCw } from 'lucide-react';

function usd(v: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
}

function when(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function Amount({ value, coin, network }: { value: string | null; coin: string; network: string }) {
  return (
    <div className="min-w-0">
      <div className="font-mono font-bold text-sm tabular-nums truncate">
        {value ?? <span className="text-muted-foreground font-normal italic">Private</span>}{' '}
        <span className="uppercase">{coin}</span>
      </div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground truncate">{network}</div>
    </div>
  );
}

function Row({ tx, i }: { tx: AffiliateTransaction; i: number }) {
  const t = when(tx.completedAt);
  return (
    <li
      data-testid={`row-affiliate-tx-${i}`}
      aria-label={`Completed swap ${tx.depositCoin} to ${tx.settleCoin}${t ? ` on ${t}` : ''}`}
      className="grid grid-cols-[1fr_auto_1fr] md:grid-cols-[120px_1fr_auto_1fr_110px] items-center gap-3 px-4 py-3 border-t-2 border-foreground/10 first:border-t-0"
    >
      <div className="col-span-3 md:col-span-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{t ?? 'Date unknown'}</div>
      <Amount value={tx.depositAmount} coin={tx.depositCoin} network={tx.depositNetwork} />
      <ArrowRight className="w-4 h-4 text-primary-ink" aria-hidden />
      <Amount value={tx.settleAmount} coin={tx.settleCoin} network={tx.settleNetwork} />
      <div className="col-span-3 md:col-span-1 md:text-right font-mono text-sm font-bold tabular-nums" data-testid={`text-affiliate-tx-usd-${i}`}>
        {tx.volumeUsd === null ? <span className="text-muted-foreground font-normal text-xs">USD not disclosed</span> : usd(tx.volumeUsd)}
      </div>
    </li>
  );
}

export function AffiliateActivity() {
  const { data, isLoading, isError, isFetching, refetch } = useGetAffiliateActivity({
    query: { queryKey: getGetAffiliateActivityQueryKey(), refetchInterval: 60000, staleTime: 60000 },
  });
  const stale = !!data && (data.stale || isError);
  const time = when(data?.updatedAt);
  const txs = data?.recentTransactions ?? [];

  return (
    <section aria-labelledby="affiliate-heading" data-testid="section-affiliate" className="w-full">
      <div className="mb-4">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <span className="inline-flex h-2 w-2 rounded-full" style={{ background: stale ? 'hsl(35 90% 50%)' : data ? 'hsl(var(--secondary))' : 'hsl(var(--muted-foreground))' }} />
          {stale ? 'Delayed data' : data ? 'Verified activity' : isLoading ? 'Loading activity' : 'Activity unavailable'}
        </div>
        <h2 id="affiliate-heading" className="font-mono font-bold text-2xl md:text-3xl tracking-tighter">
          SabiSwap <span className="text-primary-ink">Affiliate Activity</span>
        </h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
          Completed swaps attributed to SabiSwap's affiliate account on SideShift. Figures use provider-reported USD values, not estimates from live prices.
        </p>
      </div>

      {stale && (
        <div role="status" data-testid="status-affiliate-stale" className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-foreground/30 bg-accent px-3 py-2 font-mono text-xs text-accent-foreground">
          <span>Showing cached activity{time ? ` from ${time}` : ''}. Updates may be delayed.</span>
          <button type="button" data-testid="button-affiliate-refresh" onClick={() => refetch()} className="underline underline-offset-2 shrink-0">Retry</button>
        </div>
      )}

      {isLoading ? (
        <div aria-busy="true" aria-label="Loading affiliate activity" className="grid gap-4 md:grid-cols-[280px_1fr] animate-pulse motion-reduce:animate-none">
          <div className="h-40 rounded-xl border-2 border-border bg-card" />
          <div className="h-64 rounded-xl border-2 border-border bg-card" />
        </div>
      ) : !data ? (
        <div role="alert" data-testid="status-affiliate-error" className="rounded-xl border-2 border-dashed border-foreground/40 bg-card p-8 text-center space-y-3">
          <p className="font-mono font-bold">Affiliate activity could not be loaded.</p>
          <p className="text-sm text-muted-foreground">Swaps are not affected. Try again in a moment.</p>
          <button type="button" data-testid="button-affiliate-retry" onClick={() => refetch()} disabled={isFetching}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-foreground bg-primary text-primary-foreground font-mono text-sm brutalist-shadow-sm disabled:opacity-60">
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin motion-reduce:animate-none' : ''}`} />
            Retry
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-[280px_1fr] items-start">
          <dl className="rounded-xl border-2 border-foreground bg-card p-5 shadow-[4px_4px_0_0_hsl(var(--primary))] space-y-5">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Total all-time volume</dt>
              <dd data-testid="text-affiliate-total" className="font-mono font-bold text-3xl tracking-tight tabular-nums break-words">
                {data.totalVolumeUsd === null ? (
                  <span className="block text-base text-muted-foreground font-medium mt-1">Unavailable: not fully reported by provider</span>
                ) : usd(data.totalVolumeUsd)}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Completed swaps</dt>
              <dd data-testid="text-affiliate-count" className="font-mono font-bold text-2xl tabular-nums">
                {data.completedTransactions.toLocaleString('en-US')}
              </dd>
            </div>
          </dl>

          <div className="rounded-xl border-2 border-foreground bg-card overflow-hidden">
            <div className="px-4 py-2 border-b-2 border-foreground bg-muted font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Latest completed swaps{txs.length ? ` (${txs.length})` : ''}
            </div>
            {txs.length === 0 ? (
              <div data-testid="status-affiliate-empty" className="p-8 text-center space-y-1">
                <p className="font-mono font-bold">No completed affiliate swaps yet.</p>
                <p className="text-sm text-muted-foreground">Finished swaps will appear here once SideShift reports them.</p>
              </div>
            ) : (
              <ol aria-label="Most recent completed affiliate swaps" data-testid="list-affiliate-tx" className="m-0 p-0 list-none">
                {txs.map((tx, i) => <Row key={`${tx.completedAt}-${i}`} tx={tx} i={i} />)}
              </ol>
            )}
          </div>
        </div>
      )}

      <div className="mt-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground" data-testid="text-affiliate-timestamp">
        {time ? `Updated ${time}` : 'Awaiting data'} · refreshed every few minutes · amounts marked Private are not disclosed
      </div>
    </section>
  );
}
