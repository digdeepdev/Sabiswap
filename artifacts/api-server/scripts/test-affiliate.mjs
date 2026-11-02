import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(tmpdir(), `sabiswap-affiliate-tests-${process.pid}.mjs`);
try {
  await build({
    entryPoints: [path.join(root, "src/lib/affiliate-activity.test.ts")],
    bundle: true, platform: "node", format: "esm", outfile: output,
  });
  const result = spawnSync(process.execPath, ["--test", output], {
    stdio: "inherit", env: { ...process.env, NODE_ENV: "test" },
  });
  process.exitCode = result.status ?? 1;
} finally {
  await unlink(output).catch(() => {});
}
