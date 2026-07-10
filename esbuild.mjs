import * as esbuild from "esbuild";
import { mkdirSync, existsSync, unlinkSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const watch = process.argv.includes("--watch");

const ctx = await esbuild.context({
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outfile: "out/extension.js",
  external: ["vscode", "node:sqlite"],
  format: "cjs",
  platform: "node",
  target: "node18",
  sourcemap: watch,
  minify: false,
  logLevel: "info",
});

if (watch) {
  await ctx.watch();
  console.log("watching…");
} else {
  await ctx.rebuild();
  const outDir = join(__dirname, "out");
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }
  // Drop any leftover maps from watch builds so they are not packaged
  const mapPath = join(outDir, "extension.js.map");
  if (existsSync(mapPath)) {
    unlinkSync(mapPath);
  }
  // Remove leftover sql.js wasm from older builds
  const wasmPath = join(outDir, "sql-wasm.wasm");
  if (existsSync(wasmPath)) {
    unlinkSync(wasmPath);
  }
  await ctx.dispose();
}
