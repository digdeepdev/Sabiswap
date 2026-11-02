import type { ReactNode } from 'react';
import type { CampaignPhase, CampaignEntryReceiptStatus } from '@workspace/api-client-react';
import { cn } from '@/lib/utils';

export function ProgressBar({ percent, className }: { percent: number; className?: string }) {
  const p = Math.max(0, Math.min(100, percent));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(p * 10) / 10}
      className={cn('relative h-4 w-full overflow-hidden rounded-full border-2 border-foreground bg-muted', className)}
    >
      <div
        className="absolute inset-y-0 left-0 w-full origin-left bg-primary transition-transform duration-700 ease-out"
        style={{ transform: `scaleX(${p / 100})` }}
      />
      <div
        className="absolute inset-0 opacity-30"
        style={{ backgroundImage: 'repeating-linear-gradient(45deg, hsl(var(--foreground) / .25) 0 2px, transparent 2px 10px)' }}
      />
    </div>
  );
}

const phaseCopy: Record<CampaignPhase, { label: string; cls: string }> = {
  upcoming: { label: 'Upcoming', cls: 'bg-accent text-accent-foreground border-primary/40' },
  active: { label: 'Live', cls: 'bg-primary text-primary-foreground border-foreground' },
  ended: { label: 'Ended', cls: 'bg-muted text-muted-foreground border-border' },
};

export function PhaseBadge({ phase }: { phase: CampaignPhase }) {
  const p = phaseCopy[phase];
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider', p.cls)}>
      {phase === 'active' && <span className="h-1.5 w-1.5 rounded-full bg-foreground animate-pulse" />}
      {p.label}
    </span>
  );
}

const statusCls: Record<CampaignEntryReceiptStatus, string> = {
  pending: 'bg-accent text-accent-foreground border-primary/30',
  approved: 'bg-primary text-primary-foreground border-foreground',
  rejected: 'bg-destructive/10 text-destructive border-destructive/40',
};

export function StatusBadge({ status }: { status: CampaignEntryReceiptStatus }) {
  return (
    <span className={cn('inline-flex rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider', statusCls[status])}>
      {status === 'pending' ? 'In review' : status}
    </span>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="rounded-xl border-2 border-foreground/10 bg-card p-4">
      <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SectionTitle({ kicker, title, children }: { kicker: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-4">
      <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-primary-ink">{kicker}</p>
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      {children && <div className="mt-1 text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

export function ErrorPanel({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-xl border-2 border-destructive/40 bg-destructive/5 p-4 text-sm">
      <p className="text-destructive">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-2 font-mono text-xs font-bold uppercase tracking-wider underline underline-offset-4">
          Retry
        </button>
      )}
    </div>
  );
}
