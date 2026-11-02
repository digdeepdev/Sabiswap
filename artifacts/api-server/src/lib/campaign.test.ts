import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import express from "express";
import cookieParser from "cookie-parser";
import pino from "pino";
import { and, eq, inArray } from "drizzle-orm";
import { db, pool, campaignOrders, campaignEntries, campaignSettings, campaignAudit, campaignAdminSessions } from "@workspace/db";
import campaignRouter from "../routes/campaign";
import { CAMPAIGN_ID, STARTS_AT, ENDS_AT, DEFAULT_TIERS, phase, moneyCents, normalizeUsername, validateTiers, inCampaignWindow } from "./campaign-policy";
import { hashToken } from "./campaign-security";

test("campaign dates, exact cents, usernames and prize allocation", () => {
  assert.equal((ENDS_AT.getTime() - STARTS_AT.getTime()) / 86400000, 100);
  assert.equal(STARTS_AT.toISOString(), "2026-11-05T23:00:00.000Z");
  assert.equal(ENDS_AT.toISOString(), "2027-02-13T23:00:00.000Z");
  assert.equal(phase(new Date(STARTS_AT.getTime() - 1)), "upcoming");
  assert.equal(phase(STARTS_AT), "active");
  assert.equal(phase(ENDS_AT), "ended");
  assert.equal(inCampaignWindow(ENDS_AT), false);
  assert.equal(moneyCents("50.01"), 5001);
  assert.equal(moneyCents("0"), 0);
  for (const value of ["NaN", "-1", "1e5", "50.001", "1,000", " 50", "Infinity", "1000000000"]) assert.throws(() => moneyCents(value));
  assert.equal(normalizeUsername("@Sabi_SWAP"), "sabi_swap");
  assert.throws(() => normalizeUsername("https://x.com/x"));
  validateTiers(DEFAULT_TIERS);
  assert.equal(DEFAULT_TIERS[3].sharePercent / 7, 5);
  assert.throws(() => validateTiers([{ rankStart: 1, rankEnd: 1, sharePercent: 99 }]));
  assert.throws(() => validateTiers([{ rankStart: 2, rankEnd: 3, sharePercent: 100 }]));
});

test("persistent campaign entry, ownership, admin review, privacy, fees and correction", async () => {
  // Runs in a separate test process. Never uses real provider credentials or creates swaps.
  process.env.NODE_ENV = "test";
  process.env.CAMPAIGN_ADMIN_PASSWORD = "test-only-password-not-a-real-secret";
  process.env.SIDESHIFT_SECRET = "test-provider-placeholder";
  process.env.SIDESHIFT_AFFILIATE_ID = "test-affiliate";
  const browserToken = randomBytes(32).toString("hex");
  const otherBrowserToken = randomBytes(32).toString("hex");
  const orderId = `campaign_test_${randomBytes(12).toString("hex")}`;
  const username = `ct_${randomBytes(5).toString("hex")}`;
  let entryId: number | null = null;
  let providerStatus = "settled";
  const originalFetch = globalThis.fetch;
  const [oldSettings] = await db.select().from(campaignSettings).where(eq(campaignSettings.campaignId, CAMPAIGN_ID));
  const beforeAudit = await db.select({ id: campaignAudit.id }).from(campaignAudit).where(eq(campaignAudit.campaignId, CAMPAIGN_ID));
  const oldAuditIds = new Set(beforeAudit.map((row) => row.id));
  const app = express();
  app.set("trust proxy", 1);
  app.use(express.json());
  app.use(cookieParser());
  const logger = pino({ enabled: false });
  app.use((req, _res, next) => { req.log = logger; next(); });
  app.use("/api", campaignRouter);
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert(address && typeof address !== "string");
  const origin = `http://127.0.0.1:${address.port}`;
  globalThis.fetch = (async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    if (String(input).startsWith("https://sideshift.ai/")) {
      assert.equal(new Headers(init?.headers).get("x-user-ip"), "8.8.8.8");
      return new Response(JSON.stringify({
        id: orderId, status: providerStatus,
        createdAt: "2026-11-06T10:00:00Z", updatedAt: "2026-11-06T10:05:00Z",
        depositCoin: "SOL", depositAmount: "1", settleCoin: "BTC",
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
    return originalFetch(input, init);
  }) as typeof fetch;
  const request = async (path: string, method = "GET", body?: unknown, cookie?: string, requestOrigin = origin) => {
    const response = await fetch(`${origin}/api/campaign${path}`, {
      method, headers: { "content-type": "application/json", origin: requestOrigin, "x-forwarded-for": "8.8.8.8", ...(cookie ? { cookie } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    // Deliberately inspect raw HTTP payloads here; production handlers validate
    // successful responses with the generated schemas.
    return { status: response.status, body: await response.json() as any, cookie: response.headers.get("set-cookie") };
  };
  const browserCookie = `sabiswap_campaign_owner=${browserToken}`;
  const entryInput = { orderId, twitterUsername: `@${username}`, followsTwitter: true, joinedTelegram: true, consent: true };
  try {
    mock.timers.enable({ apis: ["Date"], now: new Date("2026-11-01T10:00:00Z") });
    assert.equal((await request("/entries", "POST", entryInput, browserCookie)).status, 409);
    assert.equal((await request("/admin/entries")).status, 401);
    assert.equal((await request("/admin/login", "POST", { password: "bad" }, undefined, "https://evil.example")).status, 403);
    assert.equal((await request("/admin/login", "POST", { password: "bad" })).status, 401);
    const login = await request("/admin/login", "POST", { password: "test-only-password-not-a-real-secret" });
    assert.equal(login.status, 200);
    assert.match(login.cookie!, /HttpOnly/);
    assert.match(login.cookie!, /SameSite=Strict/);
    const adminCookie = login.cookie!.split(";")[0];
    assert.equal((await request("/admin/session", "GET", undefined, adminCookie)).body.authenticated, true);
    assert.equal((await request("/admin/settings", "PUT", { earnedFeesUsd: "10", evidence: "test-source", prizeTiers: DEFAULT_TIERS }, adminCookie)).status, 400);
    mock.timers.setTime(new Date("2026-11-06T12:00:00Z").getTime());
    // Login is four-hour bounded; sign in again after advancing the test clock.
    const activeLogin = await request("/admin/login", "POST", { password: "test-only-password-not-a-real-secret" });
    const activeAdminCookie = activeLogin.cookie!.split(";")[0];
    await db.insert(campaignOrders).values({ shiftId: orderId, ownerHash: hashToken(browserToken), createdAt: new Date("2026-11-06T10:00:00Z") });
    assert.equal((await request("/entries", "POST", entryInput)).status, 403);
    assert.equal((await request("/entries", "POST", entryInput, `sabiswap_campaign_owner=${otherBrowserToken}`)).status, 403);
    assert.equal((await request("/entries", "POST", { ...entryInput, followsTwitter: false }, browserCookie)).status, 400);
    const created = await request("/entries", "POST", entryInput, browserCookie);
    assert.equal(created.status, 201);
    entryId = created.body.id;
    assert.equal(created.body.status, "pending");
    assert.equal(created.body.orderId, undefined);
    assert.equal((await request("/entries", "POST", entryInput, browserCookie)).status, 409);
    const mine = await request("/entries/mine", "GET", undefined, browserCookie);
    assert.equal(mine.body.some((entry: { id: number }) => entry.id === entryId), true);
    assert.equal((await request("/entries/mine")).body.length, 0);
    let summary = (await request("")).body;
    assert.equal(summary.leaderboard.some((entry: { twitterUsername: string }) => entry.twitterUsername === username), false);
    const queue = await request("/admin/entries", "GET", undefined, activeAdminCookie);
    assert.equal(queue.body.entries.some((entry: { orderId: string }) => entry.orderId === orderId), true);
    const review = { decision: "approved", volumeUsd: "125.50", evidence: "private-test-provider-report", reviewNote: "Manual evidence checked", verifiedTwitter: true, verifiedTelegram: true, verifiedOwnership: true };
    assert.equal((await request(`/admin/entries/${entryId}/review`, "POST", { ...review, volumeUsd: "49.99" }, activeAdminCookie)).status, 400);
    assert.equal((await request(`/admin/entries/${entryId}/review`, "POST", { ...review, verifiedOwnership: false }, activeAdminCookie)).status, 400);
    providerStatus = "pending";
    assert.equal((await request(`/admin/entries/${entryId}/review`, "POST", review, activeAdminCookie)).status, 400);
    providerStatus = "settled";
    const checked = await request(`/admin/entries/${entryId}/check`, "POST", undefined, activeAdminCookie);
    assert.equal(checked.body.eligibleWindow, true);
    assert.equal((await request(`/admin/entries/${entryId}/review`, "POST", review, activeAdminCookie)).status, 200);
    assert.equal((await request(`/admin/entries/${entryId}/review`, "POST", review, activeAdminCookie)).status, 409);
    summary = (await request("")).body;
    const leader = summary.leaderboard.find((entry: { twitterUsername: string }) => entry.twitterUsername === username);
    assert.equal(leader.volumeUsd, 125.5);
    assert.equal(leader.orders, 1);
    assert(!JSON.stringify(summary).includes(orderId));
    assert(!JSON.stringify(summary).includes("private-test-provider-report"));
    assert.equal((await request("/admin/settings", "PUT", { earnedFeesUsd: "100", evidence: "cumulative-test-report", prizeTiers: DEFAULT_TIERS }, activeAdminCookie)).status, 200);
    summary = (await request("")).body;
    assert.equal(summary.earnedFeesUsd, 100);
    assert.equal(summary.communityRewardsUsd, 80);
    assert.equal((await request("/admin/settings", "PUT", { earnedFeesUsd: "100", evidence: "cumulative-test-report", prizeTiers: [{ rankStart: 1, rankEnd: 1, sharePercent: 100 }] }, activeAdminCookie)).status, 400);
    assert.equal((await request(`/admin/entries/${entryId}/review`, "POST", { ...review, decision: "pending" }, activeAdminCookie)).status, 200);
    summary = (await request("")).body;
    assert.equal(summary.leaderboard.some((entry: { twitterUsername: string }) => entry.twitterUsername === username), false);
    assert.equal((await request(`/admin/entries/${entryId}/review`, "POST", { ...review, decision: "rejected", reviewNote: "Invalid social membership" }, activeAdminCookie)).status, 200);
    assert.equal((await request("/entries/mine", "GET", undefined, browserCookie)).body.find((entry: { id: number }) => entry.id === entryId).status, "rejected");
    assert.equal((await request("/admin/logout", "POST", undefined, activeAdminCookie)).status, 200);
    assert.equal((await request("/admin/entries", "GET", undefined, activeAdminCookie)).status, 401);
    mock.timers.setTime(ENDS_AT.getTime());
    assert.equal((await request("/entries", "POST", entryInput, browserCookie)).status, 409);
  } finally {
    globalThis.fetch = originalFetch;
    mock.timers.reset();
    if (entryId) await db.delete(campaignAudit).where(eq(campaignAudit.entryId, entryId));
    await db.delete(campaignEntries).where(eq(campaignEntries.shiftId, orderId));
    await db.delete(campaignOrders).where(eq(campaignOrders.shiftId, orderId));
    const newAudit = await db.select({ id: campaignAudit.id }).from(campaignAudit).where(and(eq(campaignAudit.campaignId, CAMPAIGN_ID), eq(campaignAudit.action, "settings_reconciliation")));
    const ids = newAudit.filter((row) => !oldAuditIds.has(row.id)).map((row) => row.id);
    if (ids.length) await db.delete(campaignAudit).where(inArray(campaignAudit.id, ids));
    if (oldSettings) await db.update(campaignSettings).set(oldSettings).where(eq(campaignSettings.campaignId, CAMPAIGN_ID));
    else await db.delete(campaignSettings).where(eq(campaignSettings.campaignId, CAMPAIGN_ID));
    await db.delete(campaignAdminSessions).where(eq(campaignAdminSessions.passwordVersion, hashToken("test-only-password-not-a-real-secret")));
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await pool.end();
  }
});
