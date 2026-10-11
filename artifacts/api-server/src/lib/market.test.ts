import assert from "node:assert/strict";
import { test } from "node:test";
import { MarketPriceService } from "./market";

const providerCoin = {
  id: "bitcoin", symbol: "btc", name: "Bitcoin", image: "https://example.test/btc.png",
  current_price: 100_000, price_change_percentage_24h: 0, market_cap_rank: 1,
  sparkline_in_7d: { price: [99_000, 100_000] }, last_updated: "2026-10-11T12:00:00Z",
};

test("maps real prices and shares a fresh cache across concurrent visitors", async () => {
  let calls = 0;
  const service = new MarketPriceService(async () => {
    calls++;
    return Response.json([providerCoin]);
  });
  const results = await Promise.all([service.get(), service.get(), service.get()]);
  assert.equal(calls, 1);
  assert.equal(results[0].coins[0].change24h, 0);
  assert.deepEqual(results[0].coins[0].sparkline, [99_000, 100_000]);
  assert.equal(results[0].stale, false);
  await service.get();
  assert.equal(calls, 1);
});

test("clearly marks cached data stale on provider failure and bounds its lifetime", async () => {
  let time = Date.parse("2026-10-11T12:00:00Z");
  let calls = 0;
  const service = new MarketPriceService(async () => {
    calls++;
    return calls === 1 ? Response.json([providerCoin]) : new Response("", { status: 429 });
  }, () => time);
  const first = await service.get();
  time += 61_000;
  const stale = await service.get();
  assert.equal(stale.stale, true);
  assert.equal(stale.fetchedAt, first.fetchedAt);
  await service.get();
  assert.equal(calls, 2, "failed refreshes have a cooldown");
  time += 15 * 60_000;
  await assert.rejects(service.get(), /temporarily unavailable/);
});

test("does not manufacture prices when the provider is unavailable or invalid", async () => {
  const unavailable = new MarketPriceService(async () => new Response("", { status: 503 }));
  await assert.rejects(unavailable.get(), /temporarily unavailable/);
  const invalid = new MarketPriceService(async () => Response.json([{ ...providerCoin, current_price: null }]));
  await assert.rejects(invalid.get(), /temporarily unavailable/);
});
