import type { Options } from "../../../options.js";
import { renderPackageJson } from "../../../scaffold/generators/packageJson.js";
import { renderViteConfig } from "../../../scaffold/generators/viteConfig.js";
import type { Contribution, FilePlan, PkgDeps } from "../../contributors.js";

export const tsContributor = (opts: Options): Contribution => {
  if (!opts.languages.includes("typescript")) {
    return { files: [], postSteps: [], deps: {} };
  }

  const contributedDeps: PkgDeps = {
    dependencies: {},
    devDependencies: {},
    scripts: {},
  };

  const files: FilePlan[] = [
    { template: "ts/tsconfig.json.tmpl", target: "tsconfig.json" },
    { template: "ts/.oxlintrc.json", target: ".oxlintrc.json" },
    { template: "ts/.oxfmtrc.json", target: ".oxfmtrc.json" },
    { template: "ts/src/index.ts.tmpl", target: "src/index.ts" },
    { template: "ts/tests/smoke.test.ts.tmpl", target: "tests/smoke.test.ts" },
    { target: "package.json", content: renderPackageJson(opts, contributedDeps), raw: true },
    { target: "vite.config.ts", content: renderViteConfig(opts), raw: true },
  ];

  return {
    files,
    postSteps: [],
    deps: { ts: contributedDeps },
  };
};
