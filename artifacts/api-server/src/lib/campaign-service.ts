import type { Request } from "express";
import { and, eq, sql } from "drizzle-orm";
import { db, campaignEntries, campaignSettings, type CampaignEntry } from "@workspace/db";
import { CAMPAIGN_ID, DEFAULT_TIERS, STARTS_AT, ENDS_AT, CampaignError, inCampaignWindow, phase, TARGET_CENTS, MINIMUM_CENTS } from "./campaign-policy";
import { sideShiftRequest } from "./sideshift";
import { publicUserIp } from "./user-ip";

export function receipt(row: CampaignEntry) {
  return {
    id: row.id, twitterUsername: row.twitterUsername, status: row.status,
    volumeUsd: row.status === "approved" && row.volumeCents !== null ? row.volumeCents / 100 : null,
    submittedAt: row.submittedAt.toISOString(),
  };
}

export function adminEntry(row: CampaignEntry) {
  return { ...receipt(row), orderId: row.shiftId, reviewNote: row.reviewNote, evidence: row.evidence, reviewedAt: row.reviewedAt?.toISOString() ?? null };
}

export async function getSettings() {
  const [row] = await db.select().from(campaignSettings).where(eq(campaignSettings.campaignId, CAMPAIGN_ID));
  return {
    earnedFeesUsd: row?.earnedFeesCents == null ? null : row.earnedFeesCents / 100,
    evidence: row?.evidence ?? "",
    prizeTiers: row?.prizeTiers ?? DEFAULT_TIERS,
    updatedAt: row?.updatedAt.toISOString() ?? null,
  };
}

export async function campaignSummary(now = new Date()) {
  const condition = and(eq(campaignEntries.campaignId, CAMPAIGN_ID), eq(campaignEntries.status, "approved"));
  const [totals] = await db.select({
    volume: sql<string>`coalesce(sum(${campaignEntries.volumeCents}), 0)`,
    orders: sql<number>`count(*)::int`,
    participants: sql<number>`count(distinct ${campaignEntries.twitterUsername})::int`,
  }).from(campaignEntries).where(condition);
  const leaders = await db.select({
    twitterUsername: campaignEntries.twitterUsername,
    volume: sql<string>`sum(${campaignEntries.volumeCents})`,
    orders: sql<number>`count(*)::int`,
  }).from(campaignEntries).where(condition).groupBy(campaignEntries.twitterUsername)
    .orderBy(sql`sum(${campaignEntries.volumeCents}) desc`, sql`min(${campaignEntries.submittedAt}) asc`, campaignEntries.twitterUsername).limit(100);
  const settings = await getSettings();
  const cents = Number(totals.volume);
  return {
    name: "SabiSwap 100-Day Swap Campaign", startsAt: STARTS_AT.toISOString(), endsAt: ENDS_AT.toISOString(),
    phase: phase(now), targetVolumeUsd: TARGET_CENTS / 100, minimumSwapUsd: MINIMUM_CENTS / 100,
    verifiedVolumeUsd: cents / 100, progressPercent: Math.min(100, cents / TARGET_CENTS * 100),
    approvedOrders: totals.orders, participants: totals.participants,
    earnedFeesUsd: settings.earnedFeesUsd,
    communityRewardsUsd: settings.earnedFeesUsd == null ? null : Math.floor(Math.round(settings.earnedFeesUsd * 100) * 80 / 100) / 100,
    feesUpdatedAt: settings.updatedAt, rewardSharePercent: 80,
    twitterUrl: "https://x.com/sabiswap", telegramUrl: "https://t.me/sabiswap",
    prizeTiers: settings.prizeTiers,
    leaderboard: leaders.map((row, i) => ({ rank: i + 1, twitterUsername: row.twitterUsername, volumeUsd: Number(row.volume) / 100, orders: row.orders })),
  };
}

export async function checkProviderOrder(req: Request, shiftId: string) {
  const ip = publicUserIp(req.ip);
  if (!ip) throw new CampaignError("A valid visitor IP is required for the provider status check. Use the published SabiSwap review page.", 400);
  // GET only. Never creates a quote, shift, refund or payout.
  const result = await sideShiftRequest<unknown>(`/shifts/${encodeURIComponent(shiftId)}`, { authenticated: true, userIp: ip });
  if (!result || typeof result !== "object") throw new CampaignError("Provider returned invalid order data.", 502);
  const value = result as Record<string, unknown>;
  if (value.id !== shiftId || typeof value.status !== "string" || typeof value.createdAt !== "string") {
    throw new CampaignError("Provider returned invalid order data.", 502);
  }
  const completedAt = typeof value.updatedAt === "string" ? value.updatedAt : null;
  return {
    providerStatus: value.status,
    createdAt: value.createdAt, completedAt,
    eligibleWindow: inCampaignWindow(value.createdAt) && completedAt !== null && inCampaignWindow(completedAt),
    depositCoin: typeof value.depositCoin === "string" ? value.depositCoin : "",
    depositAmount: typeof value.depositAmount === "string" ? value.depositAmount : "",
    settleCoin: typeof value.settleCoin === "string" ? value.settleCoin : "",
  };
}
