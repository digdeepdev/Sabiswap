import { test } from "node:test";
import assert from "node:assert/strict";
import { aggregateAffiliateNodes, fetchAffiliateActivity, usdUnits } from "./affiliate-activity";

function node(id: string, status = "settled", usdValue: string | null = "10.005") {
  return {
    id, status, usdValue,
    createdAt: "2026-10-01T10:00:00Z",
    updatedAt: `2026-10-${id.padStart(2, "0")}T10:00:00Z`,
    depositMethod: { asset: { id: "btc" }, network: "bitcoin" },
    settleMethod: { asset: { id: "sol" }, network: "solana" },
    depositAmount: "0.001", settleAmount: "1.25",
    orderId: "never-public", settleAddress: "never-public-address",
  };
}

test("all-time volume uses completed provider USD values, rounds after summing, and limits recent rows to five", () => {
  const report = aggregateAffiliateNodes([
    ...Array.from({ length: 7 }, (_, i) => node(String(i + 1))),
    node("8", "pending", "9999"), node("9", "refunded", "9999"),
  ]);
  assert.equal(report.completedTransactions, 7);
  assert.equal(report.totalVolumeUsd, 70.04);
  assert.equal(report.recentTransactions.length, 5);
  assert.equal(report.recentTransactions[0].completedAt.toISOString(), "2026-10-07T10:00:00.000Z");
  assert.equal(report.recentTransactions[4].completedAt.toISOString(), "2026-10-03T10:00:00.000Z");
  assert(!JSON.stringify(report).includes("never-public"));
  assert.equal(usdUnits("0.000000000000000001"), 1n);
  assert.throws(() => usdUnits("-1"));
  assert.throws(() => usdUnits("NaN"));
});

test("empty is honestly zero; missing historic USD is unavailable, never a partial all-time total", () => {
  assert.equal(aggregateAffiliateNodes([]).totalVolumeUsd, 0);
  const report = aggregateAffiliateNodes([node("1"), node("2", "settled", null)]);
  assert.equal(report.totalVolumeUsd, null);
  assert.equal(report.completedTransactions, 2);
  assert.equal(report.recentTransactions[0].volumeUsd, null);
});

test("privacy-coin amounts and per-swap dollar values remain private", () => {
  const privateNode = node("1");
  privateNode.depositMethod.asset.id = "xmr";
  const report = aggregateAffiliateNodes([privateNode]);
  assert.equal(report.totalVolumeUsd, 10.01);
  assert.equal(report.recentTransactions[0].depositAmount, null);
  assert.equal(report.recentTransactions[0].settleAmount, null);
  assert.equal(report.recentTransactions[0].volumeUsd, null);
});

test("authenticated account-scoped pagination, real visitor header, and incomplete/mismatched history rejection", async () => {
  // Isolated test process uses only fictional credentials, never real account data.
  process.env.SIDESHIFT_SECRET = "fake-report-secret";
  process.env.SIDESHIFT_AFFILIATE_ID = "fake-affiliate";
  const originalFetch = globalThis.fetch;
  let calls = 0;
  let mode: "ok" | "mismatch" | "incomplete" | "changing" | "provider-error" = "ok";
  globalThis.fetch = async (input, options) => {
    assert.equal(String(input), "https://sideshift.ai/graphql");
    const headers = options?.headers as Record<string, string>;
    assert.equal(headers["x-sideshift-secret"], "fake-report-secret");
    assert.equal(headers["x-user-ip"], "8.8.8.8");
    const body = JSON.parse(options?.body as string);
    assert(body.query.includes("dashboardShifts"));
    assert(!body.query.includes("orderId"));
    assert(!body.query.includes("Address"));
    assert.equal(body.variables.fromDate, "1970-01-01");
    calls++;
    const next = body.variables.after === null;
    if (mode === "provider-error") return Response.json({ errors: [{ message: "private error details" }] });
    return Response.json({ data: {
      session: { id: mode === "mismatch" ? "another-account" : "fake-affiliate" },
      dashboardShifts: {
        totalCount: mode === "incomplete" ? 3 : mode === "changing" && !next ? 3 : 2,
        pageInfo: { hasNextPage: next, endCursor: next ? "private-cursor" : null },
        edges: [{ node: node(next ? "1" : "2") }],
      },
    } });
  };
  try {
    const result = await fetchAffiliateActivity("8.8.8.8");
    assert.equal(calls, 2);
    assert.equal(result.completedTransactions, 2);
    assert.equal(result.totalVolumeUsd, 20.01);
    assert(!JSON.stringify(result).includes("private-cursor"));
    mode = "mismatch";
    await assert.rejects(fetchAffiliateActivity("8.8.8.8"), /account mismatch/);
    mode = "incomplete";
    await assert.rejects(fetchAffiliateActivity("8.8.8.8"), /Incomplete/);
    mode = "changing";
    await assert.rejects(fetchAffiliateActivity("8.8.8.8"), /changed/);
    mode = "provider-error";
    await assert.rejects(fetchAffiliateActivity("8.8.8.8"), e =>
      e instanceof Error && !e.message.includes("private error details"));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
