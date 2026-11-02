import { Router, type IRouter } from "express";
import { and, eq, desc } from "drizzle-orm";
import { db, campaignEntries, campaignOrders } from "@workspace/db";
import { SubmitCampaignEntryBody, GetCampaignResponse, GetMyCampaignEntriesResponse, SubmitCampaignEntryResponse } from "@workspace/api-zod";
import { CAMPAIGN_ID, CampaignError, inCampaignWindow, normalizeUsername, phase } from "../lib/campaign-policy";
import { browserOwner, sameOrigin, rateLimit } from "../lib/campaign-security";
import { campaignSummary, receipt } from "../lib/campaign-service";
import { campaignHandler } from "../lib/campaign-http";
import adminRouter from "./campaign-admin";

const router: IRouter = Router();
router.use("/campaign", (_req, res, next) => { res.setHeader("Cache-Control", "no-store"); next(); }, sameOrigin);
router.get("/campaign", campaignHandler(async (_req, res) => {
  res.json(GetCampaignResponse.parse(await campaignSummary()));
}));

router.get("/campaign/entries/mine", campaignHandler(async (req, res) => {
  const owner = browserOwner(req);
  if (!owner) { res.json([]); return; }
  const rows = await db.select().from(campaignEntries).where(and(eq(campaignEntries.campaignId, CAMPAIGN_ID), eq(campaignEntries.ownerHash, owner)))
    .orderBy(desc(campaignEntries.submittedAt)).limit(100);
  res.json(GetMyCampaignEntriesResponse.parse(rows.map(receipt)));
}));

router.post("/campaign/entries", rateLimit("entries", 15, 15 * 60000), campaignHandler(async (req, res) => {
  const parsed = SubmitCampaignEntryBody.safeParse(req.body);
  if (!parsed.success) throw new CampaignError("Check your order ID, X username and required confirmations.");
  if (phase() !== "active") throw new CampaignError(phase() === "upcoming" ? "Entries open on 6 November 2026 at 00:00 Africa/Lagos." : "The 100-day entry window has closed.", 409);
  const data = parsed.data;
  if (!data.followsTwitter || !data.joinedTelegram || !data.consent) throw new CampaignError("Confirm both social requirements and consent to public leaderboard participation.");
  const twitterUsername = normalizeUsername(data.twitterUsername);
  const orderId = data.orderId.trim();
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(orderId)) throw new CampaignError("Enter a valid order ID.");
  const owner = browserOwner(req);
  if (!owner) throw new CampaignError("Submit from the same browser used to create your SabiSwap order. Keep its cookies until review is complete.", 403);
  const [order] = await db.select().from(campaignOrders).where(and(eq(campaignOrders.shiftId, orderId), eq(campaignOrders.ownerHash, owner)));
  if (!order) throw new CampaignError("This browser has no matching SabiSwap order. Use the browser that created the order, or contact support privately.", 403);
  if (!inCampaignWindow(order.createdAt)) throw new CampaignError("Only orders created during the campaign can enter.");
  const [existing] = await db.select({ id: campaignEntries.id }).from(campaignEntries).where(and(eq(campaignEntries.campaignId, CAMPAIGN_ID), eq(campaignEntries.shiftId, orderId)));
  if (existing) throw new CampaignError("This order has already been submitted. Check My entries for its review status.", 409);
  const [entry] = await db.insert(campaignEntries).values({ campaignId: CAMPAIGN_ID, shiftId: orderId, ownerHash: owner, twitterUsername }).onConflictDoNothing().returning();
  if (!entry) throw new CampaignError("This order has already been submitted.", 409);
  res.status(201).json(SubmitCampaignEntryResponse.parse(receipt(entry)));
}));

router.use("/campaign/admin", adminRouter);
export default router;
