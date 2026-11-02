import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { and, eq, gt, lt } from "drizzle-orm";
import { db, campaignAdminSessions, campaignOrders } from "@workspace/db";
import { CampaignError } from "./campaign-policy";

const OWNER_COOKIE = "sabiswap_campaign_owner";
const ADMIN_COOKIE = "sabiswap_campaign_admin";
const ADMIN_PATH = "/api/campaign/admin";
export const hashToken = (value: string) => createHash("sha256").update(value).digest("hex");
const token = () => randomBytes(32).toString("hex");
const cookieOptions = (req: Request) => ({ httpOnly: true, secure: req.secure || process.env.NODE_ENV === "production", sameSite: "strict" as const });
const password = () => process.env.CAMPAIGN_ADMIN_PASSWORD ?? "";
export const adminConfigured = () => password().length >= 16;

export function browserOwner(req: Request): string | null {
  const value: unknown = req.cookies?.[OWNER_COOKIE];
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value) ? hashToken(value) : null;
}

export async function recordCampaignOrder(req: Request, res: Response, shiftId: string): Promise<void> {
  let ownerHash = browserOwner(req);
  if (!ownerHash) {
    const value = token();
    ownerHash = hashToken(value);
    res.cookie(OWNER_COOKIE, value, { ...cookieOptions(req), sameSite: "lax", path: "/api", maxAge: 180 * 86400000 });
  }
  await db.insert(campaignOrders).values({ shiftId, ownerHash }).onConflictDoNothing();
}

export function sameOrigin(req: Request, res: Response, next: NextFunction): void {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) { next(); return; }
  const origin = req.get("origin");
  try {
    const url = new URL(origin ?? "");
    const allowed = new Set([
      req.get("host"),
      process.env.REPLIT_DEV_DOMAIN,
      ...(process.env.REPLIT_DOMAINS ?? "").split(","),
      "sabiswap.io", "Sabiswap.replit.app".toLowerCase(),
    ].filter(Boolean).map((host) => host!.toLowerCase()));
    if (!["http:", "https:"].includes(url.protocol) || !allowed.has(url.host.toLowerCase())) throw new Error();
  } catch {
    res.status(403).json({ error: "This action must be sent from the SabiSwap website." });
    return;
  }
  next();
}

const limits = new Map<string, { count: number; expiresAt: number }>();
export function rateLimit(bucket: string, max: number, durationMs: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    if (limits.size > 10000) {
      for (const [key, value] of limits) if (value.expiresAt <= now) limits.delete(key);
      if (limits.size > 10000) { res.status(429).json({ error: "Please try again later." }); return; }
    }
    const key = hashToken(`${bucket}:${req.ip ?? "unknown"}`);
    const record = limits.get(key);
    if (!record || record.expiresAt <= now) limits.set(key, { count: 1, expiresAt: now + durationMs });
    else if (++record.count > max) {
      res.setHeader("Retry-After", Math.ceil((record.expiresAt - now) / 1000));
      res.status(429).json({ error: "Too many attempts. Please wait before trying again." });
      return;
    }
    next();
  };
}

export async function isAdmin(req: Request): Promise<boolean> {
  if (!adminConfigured()) return false;
  const value: unknown = req.cookies?.[ADMIN_COOKIE];
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value)) return false;
  const [session] = await db.select().from(campaignAdminSessions).where(and(
    eq(campaignAdminSessions.tokenHash, hashToken(value)),
    eq(campaignAdminSessions.passwordVersion, hashToken(password())),
    gt(campaignAdminSessions.expiresAt, new Date()),
  ));
  return !!session;
}

export async function loginAdmin(req: Request, res: Response, supplied: string): Promise<void> {
  if (!adminConfigured()) throw new CampaignError("Campaign admin access is not configured. The owner must set CAMPAIGN_ADMIN_PASSWORD with at least 16 characters in Secrets.", 503);
  if (!timingSafeEqual(Buffer.from(hashToken(supplied), "hex"), Buffer.from(hashToken(password()), "hex"))) {
    throw new CampaignError("Incorrect password.", 401);
  }
  const value = token();
  const expiresAt = new Date(Date.now() + 4 * 3600000);
  await db.delete(campaignAdminSessions).where(lt(campaignAdminSessions.expiresAt, new Date()));
  await db.insert(campaignAdminSessions).values({ tokenHash: hashToken(value), passwordVersion: hashToken(password()), expiresAt });
  res.cookie(ADMIN_COOKIE, value, { ...cookieOptions(req), path: ADMIN_PATH, maxAge: 4 * 3600000 });
}

export async function logoutAdmin(req: Request, res: Response): Promise<void> {
  const value: unknown = req.cookies?.[ADMIN_COOKIE];
  if (typeof value === "string") await db.delete(campaignAdminSessions).where(eq(campaignAdminSessions.tokenHash, hashToken(value)));
  res.clearCookie(ADMIN_COOKIE, { ...cookieOptions(req), path: ADMIN_PATH });
}
