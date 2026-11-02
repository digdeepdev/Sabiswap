import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { writeFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(tmpdir(), `sabiswap-campaign-tests-${process.pid}.mjs`);
try {
  const bundle = await build({
    entryPoints: [path.join(root, "src/lib/campaign.test.ts")], bundle: true, write: false,
    platform: "node", format: "esm", external: ["pg-native"],
    banner: { js: `import { createRequire as testCreateRequire } from 'node:module'; const require = testCreateRequire(${JSON.stringify(path.join(root, "package.json"))});` },
  });
  await writeFile(output, bundle.outputFiles[0].contents);
  const code = await new Promise((resolve) => {
    const child = spawn(process.execPath, ["--test", output], { stdio: "inherit", env: { ...process.env, NODE_ENV: "test" } });
    child.on("exit", resolve);
  });
  if (code !== 0) process.exitCode = code ?? 1;
} finally {
  await unlink(output).catch(() => {});
}
