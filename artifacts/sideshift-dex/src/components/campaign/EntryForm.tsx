import { useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useSubmitCampaignEntry,
  getGetCampaignQueryKey,
  getGetMyCampaignEntriesQueryKey,
  type Campaign,
} from '@workspace/api-client-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Lock } from 'lucide-react';
import { errorMessage, lagosDate } from './campaign-utils';

const extLink = 'font-semibold text-primary-ink underline underline-offset-4 hover:opacity-80';

export function EntryForm({ campaign }: { campaign: Campaign }) {
  const qc = useQueryClient();
  const submit = useSubmitCampaignEntry();
  const [orderId, setOrderId] = useState('');
  const [username, setUsername] = useState('');
  const [follows, setFollows] = useState(false);
  const [joined, setJoined] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = campaign.phase === 'active';
  const cleanUser = username.trim().replace(/^@/, '');
  const valid = orderId.trim().length >= 8 && /^[A-Za-z0-9_]{1,15}$/.test(cleanUser) && follows && joined && consent;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!open || !valid) return;
    setError(null);
    submit.mutate(
      { data: { orderId: orderId.trim(), twitterUsername: cleanUser, followsTwitter: follows, joinedTelegram: joined, consent } },
      {
        onSuccess: (r) => {
          qc.invalidateQueries({ queryKey: getGetMyCampaignEntriesQueryKey() });
          qc.invalidateQueries({ queryKey: getGetCampaignQueryKey() });
          setOrderId('');
          setUsername('');
          setFollows(false);
          setJoined(false);
          setConsent(false);
          toast({ title: 'Entry received', description: `@${r.twitterUsername} is now in manual review.` });
        },
        onError: (err) => setError(errorMessage(err, 'Entry could not be submitted.')),
      },
    );
  };

  const check = (id: string, value: boolean, set: (v: boolean) => void, label: React.ReactNode) => (
    <div className="flex items-start gap-3">
      <Checkbox id={id} checked={value} onCheckedChange={(v) => set(v === true)} disabled={!open} className="mt-0.5 border-2" />
      <Label htmlFor={id} className="text-sm font-normal leading-relaxed">{label}</Label>
    </div>
  );

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border-4 border-foreground bg-card p-5 md:p-6 shadow-[6px_6px_0_0_hsl(var(--foreground))] space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-primary-ink">Private entry</p>
          <h2 className="text-2xl font-bold tracking-tight">Submit a completed swap</h2>
        </div>
        <Lock className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
      </div>

      {!open && (
        <p className="rounded-lg border-2 border-dashed border-foreground/20 bg-muted/50 p-3 text-sm text-muted-foreground">
          {campaign.phase === 'upcoming'
            ? `Entries open ${lagosDate(campaign.startsAt, true)} (Africa/Lagos).`
            : 'Entries are closed. The leaderboard is under final manual audit.'}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="orderId" className="font-mono text-xs font-bold uppercase tracking-wider">SabiSwap order ID</Label>
        <Input id="orderId" value={orderId} onChange={(e) => setOrderId(e.target.value)} disabled={!open} maxLength={100} autoComplete="off" spellCheck={false} placeholder="Shown on your swap tracker" className="h-12 font-mono" />
        <p className="text-xs text-muted-foreground">Submit from the same browser you used to create the order. Order IDs are never shown publicly.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="xuser" className="font-mono text-xs font-bold uppercase tracking-wider">X (Twitter) username</Label>
        <div className="flex h-12 items-center rounded-md border border-input bg-background px-3 focus-within:ring-2 focus-within:ring-ring">
          <span className="font-mono text-muted-foreground">@</span>
          <input id="xuser" value={username} onChange={(e) => setUsername(e.target.value)} disabled={!open} maxLength={16} autoComplete="off" className="h-full flex-1 bg-transparent pl-1 font-mono outline-none disabled:opacity-50" placeholder="username" />
        </div>
      </div>

      <div className="space-y-3 rounded-xl bg-muted/50 p-4">
        {check('follows', follows, setFollows, <>I follow <a href={campaign.twitterUrl} target="_blank" rel="noopener noreferrer" className={extLink}>SabiSwap on X</a>.</>)}
        {check('joined', joined, setJoined, <>I joined the <a href={campaign.telegramUrl} target="_blank" rel="noopener noreferrer" className={extLink}>SabiSwap Telegram</a>.</>)}
        {check('consent', consent, setConsent, 'I agree that my X username and verified volume may appear on the public leaderboard once approved.')}
        <p className="pl-7 text-xs text-muted-foreground">These are self-declared and checked during manual review.</p>
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={!open || !valid || submit.isPending} className="h-12 w-full font-mono font-bold uppercase tracking-wider">
        {submit.isPending ? 'Submitting...' : 'Submit for review'}
      </Button>
    </form>
  );
}
