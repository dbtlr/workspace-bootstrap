import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: ["src/cli.ts", "src/index.ts"],
    dts: true,
    format: ["esm"],
    sourcemap: true,
  },
  lint: {
    ignorePatterns: ["dist/**", "templates/**"],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    ignorePatterns: ["dist/**", "templates/**"],
  },
  staged: {
    "*.{ts,tsx,js,mjs}": "vp check --fix",
  },
  test: {
    passWithNoTests: true,
  },
});
