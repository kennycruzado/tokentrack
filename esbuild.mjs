import * as esbuild from "esbuild";
import { copyFileSync, mkdirSync, existsSync, unlinkSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const watch = process.argv.includes("--watch");

const ctx = await esbuild.context({
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outfile: "out/extension.js",
  external: ["vscode"],
  format: "cjs",
  platform: "node",
  target: "node18",
  sourcemap: watch,
  minify: false,
  logLevel: "info",
});

function copySqlWasm() {
  const destDir = join(__dirname, "out");
  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true });
  }
  const src = join(__dirname, "node_modules", "sql.js", "dist", "sql-wasm.wasm");
  const dest = join(destDir, "sql-wasm.wasm");
  copyFileSync(src, dest);
}

if (watch) {
  await ctx.watch();
  copySqlWasm();
  console.log("watching…");
} else {
  await ctx.rebuild();
  copySqlWasm();
  // Drop any leftover maps from watch builds so they are not packaged
  const mapPath = join(__dirname, "out", "extension.js.map");
  if (existsSync(mapPath)) {
    unlinkSync(mapPath);
  }
  await ctx.dispose();
}
