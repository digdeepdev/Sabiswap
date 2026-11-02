import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetCampaignSettings,
  getGetCampaignSettingsQueryKey,
  useUpdateCampaignSettings,
  getGetCampaignQueryKey,
  type CampaignTier,
  type CampaignPhase,
} from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2 } from 'lucide-react';
import { ErrorPanel } from './CampaignBits';
import { errorMessage, errorStatus, localDateTime, pct, perRankShare, usd, validateTiers } from './campaign-utils';

export function AdminSettingsPanel({ phase, onUnauthorized }: { phase: CampaignPhase | undefined; onUnauthorized: () => void }) {
  const qc = useQueryClient();
  const q = useGetCampaignSettings({ query: { queryKey: getGetCampaignSettingsQueryKey() } });
  const update = useUpdateCampaignSettings();
  const [fees, setFees] = useState('');
  const [evidence, setEvidence] = useState('');
  const [tiers, setTiers] = useState<CampaignTier[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const initAt = useRef<string | null | undefined>(undefined);

  const unauthorized = errorStatus(q.error) === 401;
  useEffect(() => { if (unauthorized) onUnauthorized(); }, [unauthorized, onUnauthorized]);

  useEffect(() => {
    if (q.data && initAt.current !== q.data.updatedAt) {
      initAt.current = q.data.updatedAt;
      setFees(q.data.earnedFeesUsd === null ? '' : String(q.data.earnedFeesUsd));
      setEvidence(q.data.evidence);
      setTiers(q.data.prizeTiers.map((t) => ({ ...t })));
    }
  }, [q.data]);

  const tiersEditable = phase === 'upcoming';
  const tierError = validateTiers(tiers);
  const feesSet = fees.trim() !== '';
  const evidenceError = feesSet && evidence.trim().length < 5 ? 'Evidence is required to save a fee reconciliation.' : null;

  const setTier = (i: number, patch: Partial<CampaignTier>) => setTiers((ts) => ts.map((t, j) => (j === i ? { ...t, ...patch } : t)));

  const save = () => {
    setErr(null);
    update.mutate(
      { data: { earnedFeesUsd: feesSet ? fees.trim() : null, evidence: evidence.trim(), prizeTiers: tiers } },
      {
        onSuccess: (s) => {
          qc.setQueryData(getGetCampaignSettingsQueryKey(), s);
          qc.invalidateQueries({ queryKey: getGetCampaignQueryKey() });
          toast({ title: 'Campaign settings saved' });
        },
        onError: (e) => setErr(errorMessage(e, 'Settings could not be saved.')),
      },
    );
  };

  if (q.isLoading) return <Skeleton className="h-96 w-full rounded-2xl" />;
  if (q.isError && !unauthorized) return <ErrorPanel message={errorMessage(q.error, 'Settings could not be loaded.')} onRetry={() => q.refetch()} />;
  if (!q.data) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4 rounded-2xl border-2 border-foreground/10 bg-card p-5">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-primary-ink">Fee reconciliation</p>
          <h3 className="text-lg font-bold">Cumulative actual affiliate fees</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the real cumulative campaign affiliate fee in USD from the SideShift dashboard or export. Do not estimate from volume. Leave empty for not yet reconciled; 0 means actually zero.
          </p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 font-mono text-xs">
          Current: {q.data.earnedFeesUsd === null ? 'not reconciled' : usd(q.data.earnedFeesUsd)}
          {q.data.updatedAt && <> &middot; updated {localDateTime(q.data.updatedAt)}</>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fees" className="font-mono text-xs font-bold uppercase">Earned fees USD</Label>
          <Input id="fees" inputMode="decimal" value={fees} onChange={(e) => setFees(e.target.value)} maxLength={30} placeholder="Not reconciled" className="font-mono" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sev" className="font-mono text-xs font-bold uppercase">Evidence (private)</Label>
          <Textarea id="sev" value={evidence} onChange={(e) => setEvidence(e.target.value)} maxLength={500} placeholder="Export filename, date range, dashboard reference" />
          {evidenceError && <p className="text-xs text-destructive">{evidenceError}</p>}
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border-2 border-foreground/10 bg-card p-5">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-primary-ink">Prize tiers</p>
          <h3 className="text-lg font-bold">Pool split</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {tiersEditable ? 'Editable until the campaign starts. Group shares divide equally across their ranks.' : 'Locked: tiers can only change before the campaign starts.'}
          </p>
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 font-mono text-[10px] font-bold uppercase text-muted-foreground">
            <span>From rank</span><span>To rank</span><span>Group %</span><span className="w-9" />
          </div>
          {tiers.map((t, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2">
              <Input type="number" value={t.rankStart} disabled={!tiersEditable} onChange={(e) => setTier(i, { rankStart: Number(e.target.value) })} className="font-mono" />
              <Input type="number" value={t.rankEnd} disabled={!tiersEditable} onChange={(e) => setTier(i, { rankEnd: Number(e.target.value) })} className="font-mono" />
              <Input type="number" step="0.01" value={t.sharePercent} disabled={!tiersEditable} onChange={(e) => setTier(i, { sharePercent: Number(e.target.value) })} className="font-mono" />
              <Button type="button" size="icon" variant="ghost" disabled={!tiersEditable || tiers.length <= 1} onClick={() => setTiers((ts) => ts.filter((_, j) => j !== i))} aria-label="Remove tier">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {tiersEditable && (
            <Button type="button" variant="outline" size="sm" disabled={tiers.length >= 20} onClick={() => {
              const next = (tiers[tiers.length - 1]?.rankEnd ?? 0) + 1;
              setTiers([...tiers, { rankStart: next, rankEnd: next, sharePercent: 1 }]);
            }}>
              <Plus className="h-4 w-4" /> Add tier
            </Button>
          )}
        </div>
        {tierError ? (
          <p className="text-xs text-destructive">{tierError}</p>
        ) : (
          <p className="font-mono text-xs text-muted-foreground">{tiers.map((t) => `${t.rankStart}-${t.rankEnd}: ${pct(perRankShare(t))} each`).join(' / ')}</p>
        )}
      </div>

      <div className="lg:col-span-2 flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={update.isPending || !!tierError || !!evidenceError} className="font-mono font-bold uppercase">
          {update.isPending ? 'Saving...' : 'Save settings'}
        </Button>
        {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
        <p className="text-xs text-muted-foreground">Every change is written to the audit log. Evidence is never shown publicly.</p>
      </div>
    </div>
  );
}
