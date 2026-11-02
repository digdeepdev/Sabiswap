import { useGetMyCampaignEntries } from '@workspace/api-client-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorPanel, StatusBadge } from './CampaignBits';
import { errorMessage, localDateTime, usd } from './campaign-utils';

export function MyEntries() {
  const { data, isLoading, isError, error, refetch } = useGetMyCampaignEntries();

  return (
    <div className="rounded-2xl border-2 border-foreground/10 bg-card p-5">
      <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-primary-ink">This browser</p>
      <h3 className="text-lg font-bold">Your submissions</h3>
      <div className="mt-3">
        {isLoading && <div className="space-y-2"><Skeleton className="h-12" /><Skeleton className="h-12" /></div>}
        {isError && <ErrorPanel message={errorMessage(error, 'Your submissions could not be loaded.')} onRetry={() => refetch()} />}
        {data && data.length === 0 && (
          <p className="rounded-lg border-2 border-dashed border-foreground/15 p-4 text-sm text-muted-foreground">
            Nothing submitted from this browser yet.
          </p>
        )}
        {data && data.length > 0 && (
          <ul className="divide-y divide-border">
            {data.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm font-bold">@{r.twitterUsername}</p>
                  <p className="text-xs text-muted-foreground">{localDateTime(r.submittedAt)}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={r.status} />
                  {r.status === 'approved' && r.volumeUsd !== null && (
                    <span className="font-mono text-xs">{usd(r.volumeUsd)}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
