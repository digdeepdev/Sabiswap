import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetCampaignAdminEntries,
  getGetCampaignAdminEntriesQueryKey,
  useCheckCampaignOrder,
  useReviewCampaignEntry,
  getGetCampaignQueryKey,
  getGetMyCampaignEntriesQueryKey,
  type CampaignAdminEntry,
  type CampaignReviewInputDecision,
  type GetCampaignAdminEntriesStatus,
} from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, SearchCheck } from 'lucide-react';
import { ErrorPanel, StatusBadge } from './CampaignBits';
import { PAGE_SIZE, errorMessage, errorStatus, localDateTime, usd } from './campaign-utils';

const STATUSES: GetCampaignAdminEntriesStatus[] = ['pending', 'approved', 'rejected'];

export function AdminReviewPanel({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [status, setStatus] = useState<GetCampaignAdminEntriesStatus>('pending');
  const [offset, setOffset] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const params = { status, offset };
  const q = useGetCampaignAdminEntries(params, { query: { queryKey: getGetCampaignAdminEntriesQueryKey(params) } });

  const unauthorized = errorStatus(q.error) === 401;
  useEffect(() => {
    if (unauthorized) onUnauthorized();
  }, [unauthorized, onUnauthorized]);

  const entries = q.data?.entries ?? [];
  const total = q.data?.total ?? 0;
  const selected = entries.find((e) => e.id === selectedId) ?? null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div>
        <div className="mb-3 flex gap-1 rounded-full border-2 border-foreground p-1 w-fit">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { setStatus(s); setOffset(0); setSelectedId(null); }}
              className={cn('rounded-full px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider', status === s ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground')}
            >
              {s}
            </button>
          ))}
        </div>

        {q.isLoading && <div className="space-y-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}</div>}
        {q.isError && !unauthorized && <ErrorPanel message={errorMessage(q.error, 'Queue could not be loaded.')} onRetry={() => q.refetch()} />}
        {q.data && entries.length === 0 && (
          <p className="rounded-xl border-2 border-dashed border-foreground/15 p-8 text-center text-sm text-muted-foreground">No {status} entries.</p>
        )}
        {entries.length > 0 && (
          <ul className="overflow-hidden rounded-xl border-2 border-foreground/10 bg-card">
            {entries.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(e.id)}
                  className={cn('flex w-full items-center justify-between gap-3 border-b border-border px-4 py-3 text-left last:border-0 hover:bg-muted/50', selectedId === e.id && 'bg-accent')}
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm font-bold">#{e.id} @{e.twitterUsername}</p>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">{e.orderId} &middot; {localDateTime(e.submittedAt)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={e.status} />
                    {e.volumeUsd !== null && <span className="font-mono text-xs">{usd(e.volumeUsd)}</span>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
        {total > PAGE_SIZE && (
          <div className="mt-3 flex items-center justify-between font-mono text-xs">
            <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => { setOffset(Math.max(0, offset - PAGE_SIZE)); setSelectedId(null); }}>
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <span>{offset + 1}-{Math.min(offset + PAGE_SIZE, total)} of {total}</span>
            <Button variant="outline" size="sm" disabled={offset + PAGE_SIZE >= total} onClick={() => { setOffset(offset + PAGE_SIZE); setSelectedId(null); }}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div>
        {selected ? (
          <ReviewForm key={selected.id} entry={selected} onDone={() => setSelectedId(null)} />
        ) : (
          <div className="flex h-full min-h-48 items-center justify-center rounded-2xl border-2 border-dashed border-foreground/15 p-8 text-center text-sm text-muted-foreground">
            Select an entry to recheck the order and record a decision.
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewForm({ entry, onDone }: { entry: CampaignAdminEntry; onDone: () => void }) {
  const qc = useQueryClient();
  const check = useCheckCampaignOrder();
  const review = useReviewCampaignEntry();
  const [volume, setVolume] = useState(entry.volumeUsd !== null ? String(entry.volumeUsd) : '');
  const [evidence, setEvidence] = useState(entry.evidence ?? '');
  const [note, setNote] = useState(entry.reviewNote ?? '');
  const [vTwitter, setVTwitter] = useState(false);
  const [vTelegram, setVTelegram] = useState(false);
  const [vOwner, setVOwner] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const r = check.data;
  const settledOk = !!r && r.providerStatus === 'settled' && r.eligibleWindow;
  const canApprove = settledOk && Number(volume) >= 50 && evidence.trim().length >= 5 && vTwitter && vTelegram && vOwner;

  const decide = (decision: CampaignReviewInputDecision) => {
    setErr(null);
    review.mutate(
      { id: entry.id, data: { decision, volumeUsd: volume.trim(), evidence: evidence.trim(), reviewNote: note.trim(), verifiedTwitter: vTwitter, verifiedTelegram: vTelegram, verifiedOwnership: vOwner } },
      {
        onSuccess: (res) => {
          qc.invalidateQueries({ queryKey: ['/api/campaign/admin/entries'] });
          qc.invalidateQueries({ queryKey: getGetCampaignQueryKey() });
          qc.invalidateQueries({ queryKey: getGetMyCampaignEntriesQueryKey() });
          toast({ title: `Entry #${res.id} set to ${res.status}` });
          onDone();
        },
        onError: (e) => setErr(errorMessage(e, 'Review failed.')),
      },
    );
  };

  const box = (id: string, v: boolean, set: (b: boolean) => void, label: string) => (
    <div className="flex items-center gap-2">
      <Checkbox id={id} checked={v} onCheckedChange={(x) => set(x === true)} className="border-2" />
      <Label htmlFor={id} className="text-sm font-normal">{label}</Label>
    </div>
  );

  return (
    <div className="space-y-5 rounded-2xl border-4 border-foreground bg-card p-5 shadow-[6px_6px_0_0_hsl(var(--foreground))]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-primary-ink">Entry #{entry.id}</p>
          <a href={`https://x.com/${entry.twitterUsername}`} target="_blank" rel="noopener noreferrer" className="text-xl font-bold hover:underline">@{entry.twitterUsername}</a>
          <p className="break-all font-mono text-xs text-muted-foreground">Order {entry.orderId}</p>
          {entry.reviewedAt && <p className="text-xs text-muted-foreground">Last reviewed {localDateTime(entry.reviewedAt)}</p>}
        </div>
        <StatusBadge status={entry.status} />
      </div>

      <div className="rounded-xl bg-muted/50 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-xs font-bold uppercase tracking-wider">Provider recheck</p>
          <Button size="sm" variant="outline" onClick={() => check.mutate({ id: entry.id })} disabled={check.isPending}>
            <SearchCheck className="h-4 w-4" /> {check.isPending ? 'Checking...' : 'Check order'}
          </Button>
        </div>
        {check.isError && <p className="mt-2 text-sm text-destructive">{errorMessage(check.error, 'Check failed.')}</p>}
        {r && (
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-xs">
            <dt className="text-muted-foreground">Status</dt><dd className={r.providerStatus === 'settled' ? 'font-bold text-primary-ink' : 'text-destructive'}>{r.providerStatus}</dd>
            <dt className="text-muted-foreground">In window</dt><dd className={r.eligibleWindow ? 'font-bold text-primary-ink' : 'text-destructive'}>{r.eligibleWindow ? 'yes' : 'no'}</dd>
            <dt className="text-muted-foreground">Deposit</dt><dd>{r.depositAmount} {r.depositCoin.toUpperCase()}</dd>
            <dt className="text-muted-foreground">Settle coin</dt><dd>{r.settleCoin.toUpperCase()}</dd>
            <dt className="text-muted-foreground">Created</dt><dd>{localDateTime(r.createdAt)}</dd>
            <dt className="text-muted-foreground">Completed</dt><dd>{r.completedAt ? localDateTime(r.completedAt) : '--'}</dd>
          </dl>
        )}
        <p className="mt-2 text-[11px] text-muted-foreground">Provider does not return USD. Price the deposit at completion time from the provider report.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="vol" className="font-mono text-xs font-bold uppercase">Verified USD value</Label>
          <Input id="vol" inputMode="decimal" value={volume} onChange={(e) => setVolume(e.target.value)} maxLength={30} placeholder="e.g. 128.40" className="font-mono" />
        </div>
        <div className="space-y-2 pt-1">
          {box('vt', vTwitter, setVTwitter, 'Follows on X')}
          {box('vtg', vTelegram, setVTelegram, 'Joined Telegram')}
          {box('vo', vOwner, setVOwner, 'Order ownership confirmed')}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ev" className="font-mono text-xs font-bold uppercase">Evidence (private)</Label>
        <Textarea id="ev" value={evidence} onChange={(e) => setEvidence(e.target.value)} maxLength={500} placeholder="Provider report reference, price source used" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="note" className="font-mono text-xs font-bold uppercase">Review note (required to reject)</Label>
        <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
      </div>

      {err && <p role="alert" className="text-sm text-destructive">{err}</p>}

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => decide('approved')} disabled={!canApprove || review.isPending} className="font-mono font-bold uppercase">Approve</Button>
        <Button variant="destructive" onClick={() => decide('rejected')} disabled={!note.trim() || review.isPending} className="font-mono font-bold uppercase">Reject</Button>
        {entry.status !== 'pending' && (
          <Button variant="outline" onClick={() => decide('pending')} disabled={review.isPending} className="font-mono font-bold uppercase">Reset to pending</Button>
        )}
      </div>
      {!settledOk && <p className="text-xs text-muted-foreground">Approval unlocks after a settled, in-window recheck, a value of $50+, evidence and all three confirmations.</p>}
    </div>
  );
}
