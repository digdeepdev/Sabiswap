import type { Campaign } from '@workspace/api-client-react';
import { cn } from '@/lib/utils';
import { ordinal, pct, shareForRank, usd } from './campaign-utils';

export function Leaderboard({ campaign }: { campaign: Campaign }) {
  const rows = campaign.leaderboard;
  const pool = campaign.communityRewardsUsd;
  const paidRanks = campaign.prizeTiers.reduce((m, t) => Math.max(m, t.rankEnd), 0);
  const unfilled = Math.max(0, paidRanks - rows.filter((r) => r.rank <= paidRanks).length);

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-foreground/20 p-10 text-center">
        <p className="font-mono text-4xl font-bold text-muted-foreground/40">#--</p>
        <p className="mt-3 font-bold">No approved entries yet</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          Usernames appear here only after an order passes manual review. Submitting does not place you on the board.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-foreground bg-card">
      <div className="grid grid-cols-[3rem_1fr_auto] gap-3 bg-foreground px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest text-background sm:grid-cols-[3.5rem_1fr_5rem_8rem_7rem]">
        <span>Rank</span><span>Username</span><span className="hidden text-right sm:block">Orders</span>
        <span className="text-right">Verified vol.</span><span className="hidden text-right sm:block">Pool share</span>
      </div>
      <ol>
        {rows.map((r) => {
          const share = shareForRank(campaign.prizeTiers, r.rank);
          const top = r.rank <= 3;
          return (
            <li
              key={`${r.rank}-${r.twitterUsername}`}
              className={cn(
                'grid grid-cols-[3rem_1fr_auto] items-center gap-3 border-t border-border px-4 py-3 sm:grid-cols-[3.5rem_1fr_5rem_8rem_7rem]',
                r.rank === 1 && 'bg-primary/15',
              )}
            >
              <span className={cn('font-mono text-sm font-bold', top && 'text-primary-ink')}>{ordinal(r.rank)}</span>
              <a href={`https://x.com/${r.twitterUsername}`} target="_blank" rel="noopener noreferrer nofollow" className="truncate font-mono text-sm font-bold hover:underline">
                @{r.twitterUsername}
              </a>
              <span className="hidden text-right font-mono text-sm text-muted-foreground sm:block">{r.orders}</span>
              <span className="text-right font-mono text-sm font-bold">{usd(r.volumeUsd)}</span>
              <span className="hidden text-right font-mono text-xs text-muted-foreground sm:block">
                {share === null ? '--' : pool !== null ? usd((pool * share) / 100) : pct(share)}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="border-t border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground space-y-1">
        <p>Provisional ranking, subject to final manual audit. Ties: earlier first approved submission ranks higher, then username.</p>
        {unfilled > 0 && <p>{unfilled} reward {unfilled === 1 ? 'rank is' : 'ranks are'} unfilled and remain unallocated pending announcement.</p>}
        {pool === null && <p>Pool amounts show once affiliate fees are reconciled.</p>}
      </div>
    </div>
  );
}
