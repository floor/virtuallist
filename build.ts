import { build } from "bun";

await build({
  entrypoints: ["src/index.ts"],
  outdir: "dist",
  format: "esm",
  target: "browser",
  minify: false,
  sourcemap: "linked",
});

// Generate .d.ts declarations via tsc
const tsc = Bun.spawn(["bunx", "tsc", "--emitDeclarationOnly"], {
  stdio: ["inherit", "inherit", "inherit"],
});
await tsc.exited;

console.log("Build complete → dist/");
