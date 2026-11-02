export const CAMPAIGN_ID = "sabiswap-100-days-2026";
export const STARTS_AT = new Date("2026-11-06T00:00:00+01:00");
export const ENDS_AT = new Date(STARTS_AT.getTime() + 100 * 24 * 60 * 60 * 1000);
export const TARGET_CENTS = 10_000_000;
export const MINIMUM_CENTS = 5_000;
export const DEFAULT_TIERS = [
  { rankStart: 1, rankEnd: 1, sharePercent: 30 },
  { rankStart: 2, rankEnd: 2, sharePercent: 20 },
  { rankStart: 3, rankEnd: 3, sharePercent: 15 },
  { rankStart: 4, rankEnd: 10, sharePercent: 35 },
];

export class CampaignError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}

export function phase(now = new Date()): "upcoming" | "active" | "ended" {
  return now < STARTS_AT ? "upcoming" : now < ENDS_AT ? "active" : "ended";
}

export function inCampaignWindow(value: string | Date): boolean {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date >= STARTS_AT && date < ENDS_AT;
}

export function moneyCents(value: string): number {
  if (!/^(0|[1-9]\d{0,8})(\.\d{1,2})?$/.test(value)) {
    throw new CampaignError("Enter a USD amount with at most two decimal places, without symbols or commas.");
  }
  const [whole, fraction = ""] = value.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

export function normalizeUsername(value: string): string {
  const username = value.trim().replace(/^@/, "").toLowerCase();
  if (!/^[a-z0-9_]{1,15}$/.test(username)) throw new CampaignError("Enter a valid X username, not a profile URL.");
  return username;
}

export function validateTiers(tiers: { rankStart: number; rankEnd: number; sharePercent: number }[]): void {
  if (!tiers.length || tiers.length > 20) throw new CampaignError("Configure between 1 and 20 prize tiers.");
  let nextRank = 1;
  let sum = 0;
  for (const tier of tiers) {
    if (!Number.isInteger(tier.rankStart) || !Number.isInteger(tier.rankEnd) ||
        tier.rankStart !== nextRank || tier.rankEnd < tier.rankStart || tier.rankEnd > 100 ||
        !Number.isFinite(tier.sharePercent) || tier.sharePercent <= 0 || tier.sharePercent > 100 ||
        Math.abs(tier.sharePercent * 100 - Math.round(tier.sharePercent * 100)) > 0.00001) {
      throw new CampaignError("Tiers must cover consecutive ranks from 1, with valid percentages to two decimal places.");
    }
    nextRank = tier.rankEnd + 1;
    sum += Math.round(tier.sharePercent * 100);
  }
  if (sum !== 10000) throw new CampaignError("Prize tier percentages must total 100%.");
}
