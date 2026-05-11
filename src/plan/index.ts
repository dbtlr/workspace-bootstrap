import type { Options } from "../options.js";
import type { Contributor, PkgDeps, Plan } from "./contributors.js";

const mergePkgDeps = (a: PkgDeps | undefined, b: PkgDeps | undefined): PkgDeps | undefined => {
  if (!a && !b) return undefined;
  return {
    dependencies: { ...a?.dependencies, ...b?.dependencies },
    devDependencies: { ...a?.devDependencies, ...b?.devDependencies },
    scripts: { ...a?.scripts, ...b?.scripts },
  };
};

export const buildPlan = (opts: Options, contributors: Contributor[]): Plan => {
  const plan: Plan = { files: [], postSteps: [], deps: {} };
  for (const contributor of contributors) {
    const contribution = contributor(opts);
    plan.files.push(...contribution.files);
    plan.postSteps.push(...contribution.postSteps);
    if (contribution.deps.ts) {
      plan.deps.ts = mergePkgDeps(plan.deps.ts, contribution.deps.ts);
    }
    if (contribution.deps.rust) {
      plan.deps.rust = {
        dependencies: { ...plan.deps.rust?.dependencies, ...contribution.deps.rust.dependencies },
        devDependencies: {
          ...plan.deps.rust?.devDependencies,
          ...contribution.deps.rust.devDependencies,
        },
      };
    }
    if (contribution.deps.python) {
      plan.deps.python = {
        dependencies: [
          ...(plan.deps.python?.dependencies ?? []),
          ...(contribution.deps.python.dependencies ?? []),
        ],
        devDependencies: [
          ...(plan.deps.python?.devDependencies ?? []),
          ...(contribution.deps.python.devDependencies ?? []),
        ],
      };
    }
  }
  return plan;
};

export type { Contributor, Plan } from "./contributors.js";
