// Atomic design lint rules, flat config. Written by `atomic-design:setup`.
// Spread into your config:  import atomic from "./atomic.eslint.mjs";  export default [...yours, ...atomic];
// It reads .atomic-design.json and the baseline, so it needs no edits when the map changes.
import { existsSync, readFileSync } from "node:fs";

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));
const map = read("./.atomic-design.json");
const baselinePath = map.baseline ?? ".atomic-design-baseline.json";
const baselined = existsSync(new URL(`./${baselinePath}`, import.meta.url))
  ? [...new Set(read(`./${baselinePath}`).filter((b) => b.rule === "data-in-containers" || b.rule === "atomic-components").map((b) => b.file))]
  : [];

const levels = ["atoms", "molecules", "organisms", "templates"];
const ignores = ["**/*.stories.*", "**/*.test.*", "**/*.spec.*", "**/*.fixture.*"];
const containerPattern = String(Array.isArray(map.containers) ? map.containers[0] : map.containers ?? "**/*-container.tsx")
  .replace(/\.tsx$/, "").replace(/^\*\*\//, "**/");

// Upward imports: a level may not import a level above it. Only levels whose last folder
// name is distinctive can be matched by import path; use eslint-plugin-boundaries otherwise.
const lastDir = (g) => g.replace(/\/\*\*$/, "").split("/").pop();
const above = (i) => levels.slice(i + 1).map((l) => (map.levels?.[l] ?? []).map(lastDir)).flat()
  .filter((d) => d && !["ui", "src", "*", "components", "shared"].includes(d));
const upward = (i) => above(i).map((d) => `**/${d}`).flatMap((p) => [p, `${p}/**`]);

const restricted = (i) => ({
  paths: [],
  patterns: [
    ...map.dataModules.map((m) => ({
      group: m.endsWith("*") ? [m] : [m, `${m}/**`],
      // Matches the suite: type-only imports carry no runtime data dependency.
      allowTypeImports: true,
      message: "data-in-containers: library components take props and emit callbacks; only containers and pages touch data.",
    })),
    { group: [containerPattern], message: "atomic-components: a library component never imports a container." },
    ...(upward(i).length ? [{ group: upward(i), message: "atomic-components: a level imports only its own level and below." }] : []),
  ],
});

export default [
  ...levels.flatMap((l, i) => {
    const globs = (map.levels?.[l] ?? []).map((g) => `${g.replace(/\/\*\*$/, "")}/**/*.{ts,tsx,js,jsx}`);
    return globs.length ? [{ files: globs, ignores, rules: { "no-restricted-imports": ["error", restricted(i)] } }] : [];
  }),
  // Known debt (the baseline) shows as a warning, not an error, and disappears as entries are removed.
  ...(baselined.length ? [{ files: baselined, rules: { "no-restricted-imports": ["warn", restricted(levels.length)] } }] : []),
];
