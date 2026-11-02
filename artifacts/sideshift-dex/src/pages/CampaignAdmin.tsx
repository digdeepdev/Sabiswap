import { useCallback, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetCampaignAdminSession,
  getGetCampaignAdminSessionQueryKey,
  useLoginCampaignAdmin,
  useLogoutCampaignAdmin,
  useGetCampaign,
  getGetCampaignQueryKey,
  getGetCampaignSettingsQueryKey,
} from '@workspace/api-client-react';
import { PageLayout } from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { KeyRound, LogOut } from 'lucide-react';
import { AdminReviewPanel } from '@/components/campaign/AdminReviewPanel';
import { AdminSettingsPanel } from '@/components/campaign/AdminSettingsPanel';
import { ErrorPanel, PhaseBadge, Stat } from '@/components/campaign/CampaignBits';
import { errorMessage, usd, usdWhole } from '@/components/campaign/campaign-utils';

export default function CampaignAdmin() {
  const qc = useQueryClient();
  const session = useGetCampaignAdminSession({ query: { queryKey: getGetCampaignAdminSessionQueryKey(), refetchOnWindowFocus: true } });
  const login = useLoginCampaignAdmin();
  const logout = useLogoutCampaignAdmin();
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [tab, setTab] = useState<'review' | 'settings'>('review');

  const clearPrivate = useCallback(() => {
    qc.removeQueries({ queryKey: ['/api/campaign/admin/entries'] });
    qc.removeQueries({ queryKey: getGetCampaignSettingsQueryKey() });
    qc.setQueryData(getGetCampaignAdminSessionQueryKey(), (old: { configured: boolean } | undefined) =>
      old ? { configured: old.configured, authenticated: false } : old,
    );
  }, [qc]);

  const onLogin = (e: FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    login.mutate(
      { data: { password } },
      {
        onSuccess: (s) => { setPassword(''); qc.setQueryData(getGetCampaignAdminSessionQueryKey(), s); },
        onError: (err) => setLoginError(errorMessage(err, 'Sign in failed.')),
      },
    );
  };

  const onLogout = () => logout.mutate(undefined, { onSettled: () => clearPrivate() });

  const s = session.data;

  return (
    <PageLayout eyebrow="Private" heading="Campaign review" intro="Manual verification for community campaign entries. Not linked from public navigation.">
      {session.isLoading && <Skeleton className="h-56 w-full rounded-2xl" />}
      {session.isError && <ErrorPanel message={errorMessage(session.error, 'Session could not be checked.')} onRetry={() => session.refetch()} />}

      {s && !s.configured && (
        <div className="rounded-2xl border-2 border-dashed border-foreground/25 bg-card p-6">
          <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-primary-ink">Setup needed</p>
          <h2 className="text-xl font-bold">Admin password not configured</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The owner must add a <span className="font-mono text-foreground">CAMPAIGN_ADMIN_PASSWORD</span> secret (at least 16 characters) in the project Secrets panel, then reload this page. Swappers never need an account.
          </p>
        </div>
      )}

      {s && s.configured && !s.authenticated && (
        <form onSubmit={onLogin} className="mx-auto max-w-sm space-y-4 rounded-2xl border-4 border-foreground bg-card p-6 shadow-[6px_6px_0_0_hsl(var(--foreground))]">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary-ink" aria-hidden="true" />
            <h2 className="text-lg font-bold">Reviewer sign in</h2>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw" className="font-mono text-xs font-bold uppercase">Password</Label>
            <Input id="pw" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} maxLength={256} className="h-12" />
          </div>
          {loginError && <p role="alert" className="text-sm text-destructive">{loginError}</p>}
          <Button type="submit" disabled={!password || login.isPending} className="h-12 w-full font-mono font-bold uppercase">
            {login.isPending ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      )}

      {s && s.configured && s.authenticated && (
        <AdminDashboard tab={tab} setTab={setTab} onLogout={onLogout} loggingOut={logout.isPending} onUnauthorized={clearPrivate} />
      )}
    </PageLayout>
  );
}

function AdminDashboard({ tab, setTab, onLogout, loggingOut, onUnauthorized }: {
  tab: 'review' | 'settings'; setTab: (t: 'review' | 'settings') => void; onLogout: () => void; loggingOut: boolean; onUnauthorized: () => void;
}) {
  const { data: c } = useGetCampaign({ query: { queryKey: getGetCampaignQueryKey(), refetchInterval: 30_000 } });
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full border-2 border-foreground p-1">
          {(['review', 'settings'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} className={cn('rounded-full px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider', tab === t ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground')}>
              {t === 'review' ? 'Review queue' : 'Fees & tiers'}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={onLogout} disabled={loggingOut}><LogOut className="h-4 w-4" /> Sign out</Button>
      </div>
      {c && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Phase" value={<PhaseBadge phase={c.phase} />} />
          <Stat label="Verified volume" value={usdWhole(c.verifiedVolumeUsd)} hint={`${c.approvedOrders} approved`} />
          <Stat label="Participants" value={c.participants} />
          <Stat label="Rewards pool" value={c.communityRewardsUsd === null ? 'Pending' : usd(c.communityRewardsUsd)} />
        </div>
      )}
      {tab === 'review' ? <AdminReviewPanel onUnauthorized={onUnauthorized} /> : <AdminSettingsPanel phase={c?.phase} onUnauthorized={onUnauthorized} />}
    </div>
  );
}
