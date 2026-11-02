import { useGetCampaign, getGetCampaignQueryKey } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { PageLayout, linkCls } from '@/components/PageLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { EntryForm } from '@/components/campaign/EntryForm';
import { MyEntries } from '@/components/campaign/MyEntries';
import { Leaderboard } from '@/components/campaign/Leaderboard';
import { ErrorPanel, PhaseBadge, ProgressBar, SectionTitle, Stat } from '@/components/campaign/CampaignBits';
import { daysBetween, errorMessage, lagosDate, lastEligibleDay, localDateTime, pct, perRankShare, tierLabel, usd, usdWhole } from '@/components/campaign/campaign-utils';

export default function Claim() {
  const { data: c, isLoading, isError, error, refetch } = useGetCampaign({
    query: { queryKey: getGetCampaignQueryKey(), refetchInterval: 30_000 },
  });

  const now = new Date();

  return (
    <PageLayout
      eyebrow="Community campaign"
      heading={c?.name ?? 'Road to $100K verified volume'}
      intro={<>Swap with SabiSwap, submit your completed order privately, and climb a public leaderboard built only from manually verified orders. No wallet connection, no signup.</>}
    >
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      )}
      {isError && <ErrorPanel message={errorMessage(error, 'The campaign could not be loaded.')} onRetry={() => refetch()} />}

      {c && (
        <div className="space-y-12">
          {/* Progress hero */}
          <section className="rounded-2xl border-4 border-foreground bg-card p-5 md:p-7 shadow-[8px_8px_0_0_hsl(var(--foreground))]">
            <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-muted-foreground">
              <PhaseBadge phase={c.phase} />
              <span>{lagosDate(c.startsAt, true)} to {lagosDate(c.endsAt, true)} WAT (end exclusive)</span>
            </div>
            <div className="mt-5 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Verified volume</p>
                <p className="text-5xl font-bold tracking-tighter md:text-6xl">{usdWhole(c.verifiedVolumeUsd)}</p>
              </div>
              <p className="font-mono text-sm text-muted-foreground">{pct(Math.round(c.progressPercent * 10) / 10)} of {usdWhole(c.targetVolumeUsd)}</p>
            </div>
            <ProgressBar percent={c.progressPercent} className="mt-4 h-6" />
            <p className="mt-3 text-xs text-muted-foreground">
              {c.phase === 'upcoming' && `Starts in ${daysBetween(now, new Date(c.startsAt))} days. `}
              {c.phase === 'active' && `${daysBetween(now, new Date(c.endsAt))} days left. Last eligible day ${lastEligibleDay(c.endsAt)}. `}
              Only approved entries count. Refreshes every 30 seconds.
            </p>
          </section>

          <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Approved orders" value={c.approvedOrders} />
            <Stat label="Participants" value={c.participants} />
            <Stat
              label="Actual fees earned"
              value={c.earnedFeesUsd === null ? 'Pending' : usd(c.earnedFeesUsd)}
              hint={c.feesUpdatedAt ? `Reconciled ${localDateTime(c.feesUpdatedAt)}` : 'Not yet reconciled'}
            />
            <Stat
              label={`Rewards pool (${c.rewardSharePercent}%)`}
              value={c.communityRewardsUsd === null ? 'Pending' : usd(c.communityRewardsUsd)}
              hint="Of actual affiliate fees"
            />
          </section>

          <section className="grid gap-6 md:grid-cols-[1.25fr_1fr]">
            <EntryForm campaign={c} />
            <div className="space-y-6">
              <div className="rounded-2xl border-2 border-foreground/10 bg-card p-5">
                <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-primary-ink">Rules</p>
                <h3 className="text-lg font-bold">How entries are verified</h3>
                <ol className="mt-3 space-y-2.5 text-sm text-muted-foreground">
                  {[
                    `Each swap must be at least ${usdWhole(c.minimumSwapUsd)} and COMPLETED through SabiSwap inside the campaign window.`,
                    'Submit from the browser that created the order. A private cookie links the order to you; nothing is stored in local storage.',
                    'A reviewer manually checks order ownership, provider status, USD value, and your X follow and Telegram membership.',
                    'Only approved entries count toward progress and the leaderboard. Pending and rejected entries never do.',
                  ].map((t, i) => (
                    <li key={i} className="flex gap-3"><span className="font-mono font-bold text-foreground">{String(i + 1).padStart(2, '0')}</span><span>{t}</span></li>
                  ))}
                </ol>
              </div>
              <MyEntries />
            </div>
          </section>

          <section>
            <SectionTitle kicker="Public" title="Leaderboard">Approved usernames only. Order IDs are never published.</SectionTitle>
            <Leaderboard campaign={c} />
          </section>

          <section>
            <SectionTitle kicker="Pool split" title="Reward tiers">
              Shares of the community rewards pool ({c.rewardSharePercent}% of actual affiliate fees earned), not of the {usdWhole(c.targetVolumeUsd)} volume target.
            </SectionTitle>
            <div className="grid gap-3 sm:grid-cols-3">
              {c.prizeTiers.map((t) => {
                const multi = t.rankEnd > t.rankStart;
                return (
                  <div key={t.rankStart} className="rounded-xl border-2 border-foreground/10 bg-card p-4">
                    <p className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">{tierLabel(t)}</p>
                    <p className="mt-1 text-3xl font-bold">{pct(perRankShare(t))}</p>
                    <p className="text-xs text-muted-foreground">
                      {multi ? `each, ${pct(t.sharePercent)} combined` : 'of pool'}
                      {c.communityRewardsUsd !== null && ` · ${usd((c.communityRewardsUsd * perRankShare(t)) / 100)}${multi ? ' each' : ''}`}
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Rewards are not paid instantly and payouts are not enabled in the app. Final amounts follow a manual audit after the campaign ends and will be announced on{' '}
              <a href={c.twitterUrl} target="_blank" rel="noopener noreferrer" className={linkCls}>X</a> and{' '}
              <a href={c.telegramUrl} target="_blank" rel="noopener noreferrer" className={linkCls}>Telegram</a>. Questions? See the <Link href="/faq" className={linkCls}>FAQ</Link>.
            </p>
          </section>
        </div>
      )}
    </PageLayout>
  );
}
