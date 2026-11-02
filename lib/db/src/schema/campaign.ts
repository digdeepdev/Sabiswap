import { pgTable, text, serial, timestamp, bigint, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import type { z } from "zod/v4";

export const campaignOrders = pgTable("campaign_orders", {
  shiftId: text("shift_id").primaryKey(),
  ownerHash: text("owner_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("campaign_orders_owner_idx").on(table.ownerHash)]);

export const campaignEntries = pgTable("campaign_entries", {
  id: serial("id").primaryKey(),
  campaignId: text("campaign_id").notNull(),
  shiftId: text("shift_id").notNull().references(() => campaignOrders.shiftId),
  ownerHash: text("owner_hash").notNull(),
  twitterUsername: text("twitter_username").notNull(),
  status: text("status").notNull().default("pending"),
  volumeCents: bigint("volume_cents", { mode: "number" }),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewNote: text("review_note"),
  evidence: text("evidence"),
}, (table) => [
  uniqueIndex("campaign_entries_order_unique").on(table.campaignId, table.shiftId),
  index("campaign_entries_queue_idx").on(table.campaignId, table.status, table.submittedAt),
  index("campaign_entries_owner_idx").on(table.ownerHash),
]);

export const campaignSettings = pgTable("campaign_settings", {
  campaignId: text("campaign_id").primaryKey(),
  earnedFeesCents: bigint("earned_fees_cents", { mode: "number" }),
  evidence: text("evidence").notNull().default(""),
  prizeTiers: jsonb("prize_tiers").$type<{ rankStart: number; rankEnd: number; sharePercent: number }[]>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const campaignAudit = pgTable("campaign_audit", {
  id: serial("id").primaryKey(),
  campaignId: text("campaign_id").notNull(),
  action: text("action").notNull(),
  entryId: bigint("entry_id", { mode: "number" }),
  details: jsonb("details").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const campaignAdminSessions = pgTable("campaign_admin_sessions", {
  tokenHash: text("token_hash").primaryKey(),
  passwordVersion: text("password_version").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const insertCampaignOrderSchema = createInsertSchema(campaignOrders);
export const insertCampaignEntrySchema = createInsertSchema(campaignEntries).omit({ id: true });
export const insertCampaignSettingsSchema = createInsertSchema(campaignSettings);
export const insertCampaignAuditSchema = createInsertSchema(campaignAudit).omit({ id: true });
export type CampaignOrder = typeof campaignOrders.$inferSelect;
export type CampaignEntry = typeof campaignEntries.$inferSelect;
export type InsertCampaignEntry = z.infer<typeof insertCampaignEntrySchema>;
