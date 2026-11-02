import type { GetAffiliateActivityResponse } from "@workspace/api-zod";
import { getSideShiftAffiliateId, sideShiftDashboardRequest } from "./sideshift";

type Activity = ReturnType<typeof GetAffiliateActivityResponse.parse>;
type ReportNode = {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  depositMethod: { asset: { id: string }; network: string };
  settleMethod: { asset: { id: string }; network: string };
  depositAmount: string | null;
  settleAmount: string | null;
  usdValue: string | null;
};
type ReportPage = {
  session: { id: string };
  dashboardShifts: {
    totalCount: number;
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    edges: { node: ReportNode }[];
  };
};

// This dashboard query is account-scoped, unlike /v2/recent-shifts.
// Ask only for accounting fields; never request wallet addresses or order IDs.
const REPORT_QUERY = `query SabiSwapAffiliateActivity($fromDate: String!, $toDate: String!, $after: String) {
  session { id }
  dashboardShifts(fromDate: $fromDate, toDate: $toDate, first: 1000,
    after: $after, orderBy: {field: CREATED_AT, direction: DESC}) {
    totalCount
    pageInfo { hasNextPage endCursor }
    edges { node {
      id status createdAt updatedAt depositAmount settleAmount usdValue
      depositMethod { asset { id } network }
      settleMethod { asset { id } network }
    } }
  }
}`;

/** Exact USD accumulation; do not value historic swaps using today's prices. */
export function usdUnits(value: unknown): bigint | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string" || !/^\d{1,15}(?:\.\d{1,18})?$/.test(value)) {
    throw new Error("Invalid provider USD value");
  }
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * 10n ** 18n + BigInt(fraction.padEnd(18, "0"));
}

function dollars(units: bigint): number {
  const cents = (units + 5n * 10n ** 15n) / 10n ** 16n;
  if (cents > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("Provider total exceeds safe range");
  return Number(cents) / 100;
}

const PRIVACY_COINS = new Set(["XMR", "ZEC", "DASH", "FIRO", "PIVX", "ARRR", "BEAM", "GRIN"]);

export function aggregateAffiliateNodes(nodes: ReportNode[], now = new Date()): Activity {
  let total = 0n;
  let completeUsd = true;
  const completed = nodes.filter(n => n.status === "settled");
  for (const n of completed) {
    const value = usdUnits(n.usdValue);
    if (value === null) completeUsd = false;
    else total += value;
  }
  const recentTransactions = completed
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .slice(0, 5)
    .map(n => {
      if (!Number.isFinite(Date.parse(n.updatedAt))) throw new Error("Invalid completion date");
      const depositCoin = n.depositMethod.asset.id.toUpperCase();
      const settleCoin = n.settleMethod.asset.id.toUpperCase();
      const privateSwap = PRIVACY_COINS.has(depositCoin) || PRIVACY_COINS.has(settleCoin);
      const value = usdUnits(n.usdValue);
      return {
        completedAt: new Date(n.updatedAt),
        depositCoin, depositNetwork: n.depositMethod.network,
        depositAmount: privateSwap ? null : n.depositAmount,
        settleCoin, settleNetwork: n.settleMethod.network,
        settleAmount: privateSwap ? null : n.settleAmount,
        volumeUsd: privateSwap || value === null ? null : dollars(value),
      };
    });
  return {
    totalVolumeUsd: completeUsd ? dollars(total) : null,
    completedTransactions: completed.length,
    recentTransactions,
    updatedAt: now,
    stale: false,
  };
}

export async function fetchAffiliateActivity(userIp?: string): Promise<Activity> {
  const affiliateId = getSideShiftAffiliateId();
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 86_400_000).toISOString().slice(0, 10);
  const signal = AbortSignal.timeout(30_000);
  const seen = new Map<string, ReportNode>();
  const cursors = new Set<string>();
  let after: string | null = null;
  let expectedCount: number | undefined;
  for (let page = 0; page < 100; page++) {
    const data: ReportPage = await sideShiftDashboardRequest<ReportPage>(REPORT_QUERY, {
      fromDate: "1970-01-01", toDate: tomorrow, after,
    }, userIp, signal);
    if (data.session?.id !== affiliateId) throw new Error("Affiliate account mismatch");
    const result = data.dashboardShifts;
    if (!result || !Array.isArray(result.edges) || !Number.isInteger(result.totalCount) ||
        result.totalCount < 0 || typeof result.pageInfo?.hasNextPage !== "boolean") {
      throw new Error("Invalid affiliate report");
    }
    expectedCount ??= result.totalCount;
    // A changing history must be retried, never published as a complete all-time total.
    if (expectedCount !== result.totalCount) throw new Error("Affiliate history changed while reading");
    for (const { node } of result.edges) {
      if (!node || typeof node.id !== "string" || typeof node.status !== "string") {
        throw new Error("Invalid affiliate transaction");
      }
      seen.set(node.id, node);
    }
    if (!result.pageInfo.hasNextPage) {
      if (seen.size !== expectedCount) throw new Error("Incomplete affiliate history");
      return aggregateAffiliateNodes([...seen.values()], now);
    }
    after = result.pageInfo.endCursor;
    if (!after || cursors.has(after)) throw new Error("Invalid affiliate pagination");
    cursors.add(after);
  }
  throw new Error("Affiliate history exceeds reporting limit");
}

let cached: Activity | undefined;
let validUntil = 0;
let retryAfter = 0;
let pending: Promise<Activity> | undefined;

export async function getAffiliateActivity(userIp?: string): Promise<Activity> {
  if (cached && Date.now() < validUntil) return cached;
  if (Date.now() < retryAfter) {
    if (cached) return { ...cached, stale: true };
    throw new Error("Affiliate reporting temporarily unavailable");
  }
  if (pending) return pending;
  pending = fetchAffiliateActivity(userIp).then(result => {
    cached = result;
    validUntil = Date.now() + 300_000;
    return result;
  }).catch(error => {
    retryAfter = Date.now() + 30_000;
    if (cached) return { ...cached, stale: true };
    throw error;
  }).finally(() => { pending = undefined; });
  return pending;
}
