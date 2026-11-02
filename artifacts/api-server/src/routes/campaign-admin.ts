import { Router, type IRouter } from "express";
import { and, eq, asc, sql } from "drizzle-orm";
import { db, campaignAudit, campaignEntries, campaignSettings } from "@workspace/db";
import {
  LoginCampaignAdminBody, ReviewCampaignEntryBody, UpdateCampaignSettingsBody,
  GetCampaignAdminEntriesResponse, GetCampaignSettingsResponse, ReviewCampaignEntryResponse, CheckCampaignOrderResponse,
} from "@workspace/api-zod";
import { adminConfigured, isAdmin, loginAdmin, logoutAdmin, rateLimit } from "../lib/campaign-security";
import { CAMPAIGN_ID, CampaignError, MINIMUM_CENTS, moneyCents, phase, validateTiers } from "../lib/campaign-policy";
import { adminEntry, checkProviderOrder, getSettings } from "../lib/campaign-service";
import { campaignHandler } from "../lib/campaign-http";

const router: IRouter = Router();
router.get("/session", campaignHandler(async (req, res) => {
  res.json({ configured: adminConfigured(), authenticated: await isAdmin(req) });
}));
router.post("/login", rateLimit("admin-login", 8, 15 * 60000), campaignHandler(async (req, res) => {
  const body = LoginCampaignAdminBody.safeParse(req.body);
  if (!body.success) throw new CampaignError("Enter your admin password.");
  await loginAdmin(req, res, body.data.password);
  res.json({ configured: true, authenticated: true });
}));
router.post("/logout", campaignHandler(async (req, res) => {
  await logoutAdmin(req, res);
  res.json({ configured: adminConfigured(), authenticated: false });
}));
router.use((req, res, next) => {
  isAdmin(req).then((ok) => {
    if (!ok) { res.status(401).json({ error: "Admin sign-in required." }); return; }
    next();
  }).catch(() => res.status(503).json({ error: "Admin access is temporarily unavailable." }));
});

router.get("/entries", campaignHandler(async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : "pending";
  const offset = Number(req.query.offset ?? 0);
  if (!["pending", "approved", "rejected"].includes(status) || !Number.isInteger(offset) || offset < 0 || offset > 1000000) throw new CampaignError("Invalid queue filter.");
  const filter = and(eq(campaignEntries.campaignId, CAMPAIGN_ID), eq(campaignEntries.status, status));
  const entries = await db.select().from(campaignEntries).where(filter).orderBy(asc(campaignEntries.submittedAt), asc(campaignEntries.id)).limit(25).offset(offset);
  const [total] = await db.select({ value: sql<number>`count(*)::int` }).from(campaignEntries).where(filter);
  res.json(GetCampaignAdminEntriesResponse.parse({ entries: entries.map(adminEntry), total: total.value }));
}));

async function findEntry(value: string | string[]) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new CampaignError("Invalid entry.");
  const [entry] = await db.select().from(campaignEntries).where(and(eq(campaignEntries.id, id), eq(campaignEntries.campaignId, CAMPAIGN_ID)));
  if (!entry) throw new CampaignError("Entry not found.", 404);
  return entry;
}

router.post("/entries/:id/check", rateLimit("admin-provider", 30, 60000), campaignHandler(async (req, res) => {
  const entry = await findEntry(req.params.id);
  res.json(CheckCampaignOrderResponse.parse(await checkProviderOrder(req, entry.shiftId)));
}));

router.post("/entries/:id/review", rateLimit("admin-review", 60, 60000), campaignHandler(async (req, res) => {
  const body = ReviewCampaignEntryBody.safeParse(req.body);
  if (!body.success) throw new CampaignError("Check the review fields.");
  const data = body.data;
  const entry = await findEntry(req.params.id);
  let volumeCents: number | null = null;
  if (data.decision === "approved") {
    if (entry.status !== "pending") throw new CampaignError("Return this entry to pending before approving a correction.", 409);
    if (!data.verifiedTwitter || !data.verifiedTelegram || !data.verifiedOwnership) throw new CampaignError("Verify X follow, Telegram membership and swap ownership before approval.");
    if (data.evidence.trim().length < 5) throw new CampaignError("Record the private provider-report reference used to verify the USD value.");
    volumeCents = moneyCents(data.volumeUsd);
    if (volumeCents < MINIMUM_CENTS) throw new CampaignError("A qualifying completed order must be worth at least $50.");
    const provider = await checkProviderOrder(req, entry.shiftId);
    if (provider.providerStatus !== "settled" || !provider.eligibleWindow) throw new CampaignError("Only settled orders created and completed within the campaign window qualify.");
  }
  if (data.decision === "rejected" && data.reviewNote.trim().length < 3) throw new CampaignError("Record a private reason for rejection.");
  const result = await db.transaction(async (tx) => {
    const [locked] = await tx.select().from(campaignEntries).where(eq(campaignEntries.id, entry.id)).for("update");
    if (locked.status !== entry.status) throw new CampaignError("Another review changed this entry. Refresh before continuing.", 409);
    const [updated] = await tx.update(campaignEntries).set({
      status: data.decision, volumeCents,
      evidence: data.evidence.trim() || null, reviewNote: data.reviewNote.trim() || null,
      reviewedAt: data.decision === "pending" ? null : new Date(),
    }).where(eq(campaignEntries.id, entry.id)).returning();
    await tx.insert(campaignAudit).values({
      campaignId: CAMPAIGN_ID, action: "entry_review", entryId: entry.id,
      details: { beforeStatus: locked.status, beforeVolumeCents: locked.volumeCents, decision: data.decision, volumeCents, evidence: data.evidence.trim(), note: data.reviewNote.trim(), verifiedTwitter: data.verifiedTwitter, verifiedTelegram: data.verifiedTelegram, verifiedOwnership: data.verifiedOwnership },
    });
    return updated;
  });
  res.json(ReviewCampaignEntryResponse.parse(adminEntry(result)));
}));

router.get("/settings", campaignHandler(async (_req, res) => {
  res.json(GetCampaignSettingsResponse.parse(await getSettings()));
}));
router.put("/settings", campaignHandler(async (req, res) => {
  const body = UpdateCampaignSettingsBody.safeParse(req.body);
  if (!body.success) throw new CampaignError("Check the settings fields.");
  const data = body.data;
  validateTiers(data.prizeTiers);
  const old = await getSettings();
  if (phase() !== "upcoming" && JSON.stringify(data.prizeTiers) !== JSON.stringify(old.prizeTiers)) throw new CampaignError("Prize rules are locked once the campaign starts.");
  const earnedFeesCents = data.earnedFeesUsd === null ? null : moneyCents(data.earnedFeesUsd);
  if (earnedFeesCents !== null && data.evidence.trim().length < 5) throw new CampaignError("Add a private SideShift dashboard/export reference for cumulative actual campaign affiliate fees.");
  if (phase() === "upcoming" && earnedFeesCents !== null && earnedFeesCents !== 0) throw new CampaignError("Campaign earnings cannot be recorded before the campaign starts.");
  await db.transaction(async (tx) => {
    await tx.insert(campaignSettings).values({ campaignId: CAMPAIGN_ID, earnedFeesCents, evidence: data.evidence.trim(), prizeTiers: data.prizeTiers })
      .onConflictDoUpdate({ target: campaignSettings.campaignId, set: { earnedFeesCents, evidence: data.evidence.trim(), prizeTiers: data.prizeTiers, updatedAt: new Date() } });
    await tx.insert(campaignAudit).values({
      campaignId: CAMPAIGN_ID, action: "settings_reconciliation",
      details: { before: old, after: { earnedFeesCents, evidence: data.evidence.trim(), prizeTiers: data.prizeTiers } },
    });
  });
  res.json(GetCampaignSettingsResponse.parse(await getSettings()));
}));

export default router;
