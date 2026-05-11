import type { Options } from "../../options.js";

export const renderViteConfig = (opts: Options): string => {
  const usingVitePlus = !(opts.packageManager === "bun" && opts.bunTest === "bun");

  const lines = [`import { defineConfig } from 'vite-plus';`, ""];
  lines.push("export default defineConfig({");
  lines.push("  pack: {");
  lines.push(`    entry: ['src/index.ts'],`);
  lines.push("    dts: true,");
  lines.push(`    format: ['esm'],`);
  lines.push("  },");
  lines.push("  lint: {");
  lines.push(`    ignorePatterns: ['dist/**'],`);
  lines.push("    options: {");
  lines.push("      typeAware: true,");
  lines.push("      typeCheck: true,");
  lines.push("    },");
  lines.push("  },");
  if (usingVitePlus) {
    lines.push("  staged: {");
    lines.push(`    '*.{ts,tsx,js,mjs}': 'vp check --fix',`);
    lines.push("  },");
  }
  lines.push("});");
  lines.push("");

  return lines.join("\n");
};
