import { Link } from 'wouter';
import { useGetCampaign, getGetCampaignQueryKey } from '@workspace/api-client-react';
import { ArrowRight, Trophy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { PhaseBadge, ProgressBar } from './CampaignBits';
import { lagosDate, lastEligibleDay, usdWhole } from './campaign-utils';

/** Compact preview shown in the swap card's Claim tab. */
export function CampaignPreview() {
  const { data, isLoading, isError, refetch } = useGetCampaign({
    query: { queryKey: getGetCampaignQueryKey(), refetchInterval: 30_000 },
  });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start gap-3">
        <div className="rounded-xl border-2 border-foreground bg-primary p-2.5 brutalist-shadow-sm">
          <Trophy className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-primary-ink">Community campaign</p>
          <h2 className="text-xl font-bold leading-tight">{data?.name ?? 'Road to $100K verified volume'}</h2>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border-2 border-destructive/40 p-4 text-sm">
          <p className="text-destructive">Campaign status could not be loaded.</p>
          <button type="button" onClick={() => refetch()} className="mt-2 font-mono text-xs font-bold uppercase underline underline-offset-4">
            Retry
          </button>
        </div>
      )}

      {data && (
        <>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-muted-foreground">
            <PhaseBadge phase={data.phase} />
            <span>
              {lagosDate(data.startsAt)} to {lastEligibleDay(data.endsAt)} (Lagos)
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-2xl font-bold">{usdWhole(data.verifiedVolumeUsd)}</span>
              <span className="text-xs text-muted-foreground">of {usdWhole(data.targetVolumeUsd)} verified</span>
            </div>
            <ProgressBar percent={data.progressPercent} />
            <p className="font-mono text-[11px] text-muted-foreground">
              {data.approvedOrders} approved orders &middot; {data.participants} participants
            </p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Swap {usdWhole(data.minimumSwapUsd)}+ per completed order, then submit your order ID privately. Top
            verified volumes share {data.rewardSharePercent}% of actual affiliate fees earned.
          </p>
        </>
      )}

      <Link
        href="/claim"
        className="flex h-12 w-full items-center justify-center gap-2 rounded-md border-2 border-foreground bg-foreground font-mono text-sm font-bold uppercase tracking-wider text-background transition-transform hover:-translate-y-0.5"
      >
        View campaign <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
      <p className="text-center text-xs text-muted-foreground">No wallet connection. Participation is not a payout.</p>
    </div>
  );
}
