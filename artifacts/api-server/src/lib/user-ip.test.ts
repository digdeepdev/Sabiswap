import assert from "node:assert/strict";
import test from "node:test";
import { publicUserIp } from "./user-ip";
import { sideShiftRequest } from "./sideshift";

test("preserves public IPv4 and IPv6 addresses", () => {
  assert.equal(publicUserIp("8.8.8.8"), "8.8.8.8");
  assert.equal(publicUserIp("2606:4700:4700::1111"), "2606:4700:4700::1111");
  assert.equal(publicUserIp("::ffff:8.8.8.8"), "8.8.8.8");
});

test("rejects absent, malformed, private, and reserved IPs", () => {
  for (const ip of [
    undefined, "", "not-an-ip", "8.8.8.8, 1.1.1.1", "127.0.0.1",
    "10.0.0.1", "172.24.0.2", "192.168.1.1", "169.254.1.1",
    "100.64.0.1", "::1", "fc00::1", "fe80::1", "2001:db8::1",
    "::ffff:127.0.0.1",
  ]) {
    assert.equal(publicUserIp(ip), undefined, String(ip));
  }
});

test("forwards the supplied visitor IP in the outbound x-user-ip header", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (_url, init) => {
      assert.equal(new Headers(init?.headers).get("x-user-ip"), "8.8.8.8");
      return new Response('{"ok":true}', {
        headers: { "Content-Type": "application/json" },
      });
    };
    assert.deepEqual(
      await sideShiftRequest("/quotes", { method: "POST", userIp: "8.8.8.8" }),
      { ok: true },
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("never sends a quote or shift request without a visitor IP", async () => {
  await assert.rejects(
    sideShiftRequest("/quotes", { method: "POST" }),
    /verified visitor IP/,
  );
});
