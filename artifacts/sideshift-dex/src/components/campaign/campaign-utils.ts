import type { CampaignTier } from '@workspace/api-client-react';

export const CAMPAIGN_TZ = 'Africa/Lagos';
export const PAGE_SIZE = 25;

export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!error || typeof error !== 'object') return fallback;
  const e = error as { message?: string; data?: { error?: string } | null };
  return e.data?.error ?? e.message ?? fallback;
}

export function errorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const s = (error as { status?: unknown }).status;
  return typeof s === 'number' ? s : undefined;
}

const usdFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
const usdCompact = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
export const usd = (n: number) => usdFmt.format(n);
export const usdWhole = (n: number) => usdCompact.format(n);

export function lagosDate(iso: string, withTime = false): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: CAMPAIGN_TZ,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit', hour12: false } : {}),
  }).format(new Date(iso));
}

export function localDateTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

/** Inclusive start, exclusive end: the last eligible day is the day before endsAt. */
export function lastEligibleDay(endsAtIso: string): string {
  return lagosDate(new Date(new Date(endsAtIso).getTime() - 1).toISOString());
}

export function daysBetween(a: Date, b: Date) {
  return Math.max(0, Math.ceil((b.getTime() - a.getTime()) / 86_400_000));
}

export function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function tierLabel(t: CampaignTier) {
  return t.rankStart === t.rankEnd ? ordinal(t.rankStart) : `${ordinal(t.rankStart)} to ${ordinal(t.rankEnd)}`;
}

export function perRankShare(t: CampaignTier) {
  return t.sharePercent / (t.rankEnd - t.rankStart + 1);
}

export function shareForRank(tiers: CampaignTier[], rank: number): number | null {
  const t = tiers.find((x) => rank >= x.rankStart && rank <= x.rankEnd);
  return t ? perRankShare(t) : null;
}

export function pct(n: number) {
  return `${Number.isInteger(n) ? n : n.toFixed(2).replace(/\.?0+$/, '')}%`;
}

export function validateTiers(tiers: CampaignTier[]): string | null {
  if (!tiers.length) return 'Add at least one tier.';
  let expected = 1;
  let sum = 0;
  for (const t of tiers) {
    if (!Number.isInteger(t.rankStart) || !Number.isInteger(t.rankEnd)) return 'Ranks must be whole numbers.';
    if (t.rankStart !== expected) return `Tiers must be contiguous: expected a tier starting at rank ${expected}.`;
    if (t.rankEnd < t.rankStart) return 'A tier cannot end before it starts.';
    if (!(t.sharePercent > 0)) return 'Every tier needs a share above 0%.';
    sum += t.sharePercent;
    expected = t.rankEnd + 1;
  }
  if (expected - 1 > 100) return 'Ranks cannot exceed 100.';
  if (Math.abs(sum - 100) > 0.0001) return `Shares must total 100% (currently ${pct(sum)}).`;
  return null;
}
