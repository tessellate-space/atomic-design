# ESLint

Only when the repo has ESLint. The suite remains the guarantee; ESLint shows the same
rules in the editor.

**Probe:** is `atomic.eslint.mjs` present and spread into the config? Then "already in
place".

**Act (flat config, `eslint.config.*`):**

1. Copy `templates/eslint/atomic.eslint.mjs` to the repo root (it reads
   `.atomic-design.json` and the baseline itself; it has no placeholders).
2. Spread it at the end of the config: `export default [...existing, ...atomic]`.
3. It sets `no-restricted-imports` per library level over the map's globs, listing the
   `dataModules`, any container, and upward imports where the level folder names are
   distinctive. Files in the baseline get a **warning** instead of an error, computed from
   the baseline file, so no source file is edited and the warnings disappear as the
   baseline shrinks.

**Upward imports with a plugin (optional):** if the team accepts one more dev
dependency, `eslint-plugin-boundaries` states "a level imports its own level and below"
exactly, including for feature-sliced layouts where folder names are generic. Ask first;
without it the restricted-path patterns cover distinctive folder names only.

**Legacy format (`.eslintrc*`):** write the same `no-restricted-imports` as an
`overrides` block by hand. This path is not covered by a fixture and is untested.

**Check:** add the server-state import to a library file: `npx eslint <file>` reports it
(and the suite fails too). Revert.
