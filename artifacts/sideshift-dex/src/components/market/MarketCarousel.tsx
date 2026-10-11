import { useCallback, useEffect, useRef, useState } from 'react';
import { getGetMarketPricesQueryKey, useGetMarketPrices, type MarketCoin } from '@workspace/api-client-react';
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts';
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Minus, RefreshCw } from 'lucide-react';

function formatPrice(v: number): string {
  if (!Number.isFinite(v)) return 'n/a';
  const abs = Math.abs(v);
  const digits = abs >= 1000 ? 2 : abs >= 1 ? 2 : abs >= 0.01 ? 4 : abs >= 0.0001 ? 6 : 8;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: digits,
  }).format(v);
}

function formatTime(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

type Tone = 'up' | 'down' | 'flat';
const TONE_COLOR: Record<Tone, string> = {
  up: 'hsl(150 80% 28%)',
  down: 'hsl(350 85% 48%)',
  flat: 'hsl(var(--muted-foreground))',
};

function CoinCard({ coin }: { coin: MarketCoin }) {
  const ch = coin.change24h;
  const tone: Tone = ch === null || !Number.isFinite(ch) || Math.abs(ch) < 0.005 ? 'flat' : ch > 0 ? 'up' : 'down';
  const spark = (coin.sparkline ?? []).filter((n) => Number.isFinite(n));
  const hasChart = spark.length >= 2;
  const first = spark[0];
  const last = spark[spark.length - 1];
  const weekTone: Tone = !hasChart || last === first ? 'flat' : last > first ? 'up' : 'down';
  const color = TONE_COLOR[weekTone];
  const gid = `spark-${coin.id.replace(/[^a-z0-9]/gi, '')}`;
  const Icon = tone === 'up' ? ArrowUpRight : tone === 'down' ? ArrowDownRight : Minus;
  const [imgOk, setImgOk] = useState(true);

  return (
    <li
      data-testid={`card-coin-${coin.id}`}
      className="snap-start shrink-0 basis-[78%] sm:basis-[45%] md:basis-[31%] lg:basis-[23.5%] list-none"
    >
      <div className="group h-full bg-card border-2 border-foreground rounded-xl p-4 flex flex-col gap-3 transition-transform duration-200 motion-reduce:transition-none hover:-translate-y-1 hover:shadow-[4px_4px_0_0_hsl(var(--primary))]">
        <div className="flex items-center gap-3">
          {imgOk && coin.image ? (
            <img
              src={coin.image}
              alt=""
              loading="lazy"
              onError={() => setImgOk(false)}
              className="w-9 h-9 rounded-full border border-border bg-muted"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-accent text-accent-foreground font-mono font-bold text-xs flex items-center justify-center">
              {coin.symbol.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="font-mono font-bold text-sm uppercase leading-tight">{coin.symbol}</div>
            <div className="text-xs text-muted-foreground truncate">{coin.name}</div>
          </div>
          {coin.rank !== null && (
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              #{coin.rank}
            </span>
          )}
        </div>

        <div>
          <div data-testid={`text-price-${coin.id}`} className="font-mono font-bold text-xl tracking-tight tabular-nums truncate">
            {formatPrice(coin.priceUsd)}
          </div>
          <div
            data-testid={`text-change-${coin.id}`}
            className="flex items-center gap-1 font-mono text-sm font-medium"
            style={{ color: TONE_COLOR[tone] }}
          >
            <Icon className="w-4 h-4" aria-hidden />
            <span>{ch === null || !Number.isFinite(ch) ? 'n/a' : `${ch > 0 ? '+' : ''}${ch.toFixed(2)}%`}</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground ml-1">24h</span>
          </div>
        </div>

        <div className="mt-auto">
          <div className="h-16 -mx-1" role="img" aria-label={`${coin.name} seven-day price trend${hasChart ? `, ${weekTone === 'up' ? 'rising' : weekTone === 'down' ? 'falling' : 'unchanged'}` : ', data unavailable'}`}>
            {hasChart ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spark.map((v, i) => ({ i, v }))} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <YAxis hide domain={['dataMin', 'dataMax']} />
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke={color}
                    strokeWidth={1.75}
                    fill={`url(#${gid})`}
                    dot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center border border-dashed border-border rounded text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                No chart data
              </div>
            )}
          </div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-1">
            7-day trend
          </div>
        </div>
      </div>
    </li>
  );
}

function SkeletonCard() {
  return (
    <li className="shrink-0 basis-[78%] sm:basis-[45%] md:basis-[31%] lg:basis-[23.5%] list-none">
      <div className="h-[236px] bg-card border-2 border-border rounded-xl p-4 flex flex-col gap-3 animate-pulse motion-reduce:animate-none">
        <div className="flex gap-3 items-center">
          <div className="w-9 h-9 rounded-full bg-muted" />
          <div className="space-y-2 flex-1">
            <div className="h-3 w-12 bg-muted rounded" />
            <div className="h-2.5 w-24 bg-muted rounded" />
          </div>
        </div>
        <div className="h-6 w-28 bg-muted rounded" />
        <div className="h-4 w-16 bg-muted rounded" />
        <div className="mt-auto h-14 bg-muted rounded" />
      </div>
    </li>
  );
}

export function MarketCarousel() {
  const { data, isLoading, isError, isFetching, refetch } = useGetMarketPrices({
    query: { queryKey: getGetMarketPricesQueryKey(), refetchInterval: 60000, staleTime: 60000 },
  });
  const scroller = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  const coins = data?.coins ?? [];

  useEffect(() => {
    update();
    const el = scroller.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update, coins.length, isLoading]);

  const scrollByPage = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: reduce ? 'auto' : 'smooth' });
  };

  const hasData = coins.length > 0;
  const stale = !!data && (data.stale || isError);
  const unavailable = isError && !hasData;
  const time = formatTime(data?.fetchedAt);

  return (
    <section aria-labelledby="market-heading" data-testid="section-market" className="w-full">
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <span className="relative flex h-2 w-2">
              {!stale && hasData && (
                <span className="absolute inline-flex h-full w-full rounded-full bg-secondary opacity-60 animate-ping motion-reduce:animate-none" />
              )}
              <span
                className="relative inline-flex h-2 w-2 rounded-full"
                style={{ background: stale ? 'hsl(35 90% 50%)' : hasData ? 'hsl(var(--secondary))' : 'hsl(var(--muted-foreground))' }}
              />
            </span>
            {stale ? 'Stale data' : hasData ? 'Live market' : 'Market'}
          </div>
          <h2 id="market-heading" className="font-mono font-bold text-2xl md:text-3xl tracking-tighter">
            Market <span className="text-primary">Pulse</span>
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Previous coins"
            data-testid="button-market-prev"
            disabled={!canPrev}
            onClick={() => scrollByPage(-1)}
            className="w-10 h-10 rounded-lg border-2 border-foreground bg-card flex items-center justify-center transition-all hover:bg-accent active:translate-y-px disabled:opacity-30 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            aria-label="Next coins"
            data-testid="button-market-next"
            disabled={!canNext}
            onClick={() => scrollByPage(1)}
            className="w-10 h-10 rounded-lg border-2 border-foreground bg-card flex items-center justify-center transition-all hover:bg-accent active:translate-y-px disabled:opacity-30 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {stale && (
        <div
          role="status"
          data-testid="status-market-stale"
          className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-foreground/30 bg-accent px-3 py-2 font-mono text-xs text-accent-foreground"
        >
          <span>Showing cached prices{time ? ` from ${time}` : ''}. Live refresh is currently unavailable.</span>
          <button
            type="button"
            data-testid="button-market-refresh"
            onClick={() => refetch()}
            className="underline underline-offset-2 shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {unavailable ? (
        <div
          role="alert"
          data-testid="status-market-unavailable"
          className="rounded-xl border-2 border-dashed border-foreground/40 bg-card p-8 text-center space-y-3"
        >
          <p className="font-mono font-bold">Market prices are unavailable right now.</p>
          <p className="text-sm text-muted-foreground">Swaps are not affected. Try loading prices again.</p>
          <button
            type="button"
            data-testid="button-market-retry"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-foreground bg-primary text-primary-foreground font-mono text-sm brutalist-shadow-sm disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin motion-reduce:animate-none' : ''}`} />
            Retry
          </button>
        </div>
      ) : (
        <div className="relative">
          <ul
            ref={scroller}
            onScroll={update}
            aria-label="Top cryptocurrencies by market cap"
            data-testid="list-market-coins"
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 pt-1 px-1 -mx-1 m-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ touchAction: 'pan-x pan-y' }}
          >
            {isLoading || !hasData
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
              : coins.map((c) => <CoinCard key={c.id} coin={c} />)}
          </ul>
          {canNext && (
            <div className="pointer-events-none absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-background to-transparent" />
          )}
        </div>
      )}

      <div className="mt-1 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        <span data-testid="text-market-timestamp">
          {time ? `Updated ${time}` : 'Awaiting data'} · USD · 24h change, 7-day charts
        </span>
        <a
          href="https://www.coingecko.com/"
          target="_blank"
          rel="noopener noreferrer"
          data-testid="link-coingecko"
          className="underline underline-offset-2 hover:text-foreground"
        >
          Data by CoinGecko
        </a>
      </div>
    </section>
  );
}
