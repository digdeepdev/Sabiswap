import { BlockList, isIP } from "node:net";

const nonPublic = new BlockList();
for (const [address, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const) {
  nonPublic.addSubnet(address, prefix, "ipv4");
}
for (const [address, prefix] of [
  ["::", 128],
  ["::1", 128],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
  ["2001:db8::", 32],
] as const) {
  nonPublic.addSubnet(address, prefix, "ipv6");
}

/** Accept only the address resolved by Express's configured trusted proxy. */
export function publicUserIp(ip: string | undefined): string | undefined {
  if (!ip) return undefined;
  const normalized = ip.trim().replace(/^::ffff:(?=\d+\.)/i, "");
  const version = isIP(normalized);
  if (!version) return undefined;
  if (nonPublic.check(normalized, version === 4 ? "ipv4" : "ipv6")) {
    return undefined;
  }
  return normalized;
}
