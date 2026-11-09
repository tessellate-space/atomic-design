# Step 5: enforce the data boundary in the client's suite

The checker and its tests are written into the client's repo, so they keep working
without the plugin. The plugin never imports them back.

**Probe:** does `lib/atomic-boundaries.ts` exist and match the template, and does the
unit suite run `library-complete`? Then "already in place".

**Rerun with an older checker:** when the file differs because the plugin has since added
a rule, re-render the checker and its tests, then record the new rule's existing debt once
with `ATOMIC_BASELINE_INIT=<rule id>` (`ratchet.md`), never `=1`. Report the entries added.

**Act:**

1. Render `templates/lib/atomic-boundaries.ts` and `atomic-boundaries.test.ts` into the
   folder facts name for `lib`.
2. Render `templates/tests/library-complete.test.ts` beside the components root.
3. Make sure the unit runner's `include`/`testMatch` picks up `*.test.ts` (Jest repos
   often match `*.test.tsx` only). Widen it with the smallest edit and say so.
4. Run the baseline step (`ratchet.md`) before the first full run.
5. Set `tests.boundary` in the map to a command that runs only `library-complete` (for
   example `npx vitest run --project=unit library-complete`).

What the checker enforces (`rules` in the map sets each severity; see `ratchet.md`):

- `data-in-containers`: no library file imports a module in `dataModules`. Always `error`.
- `atomic-components`: no library file imports a container.
- `stories-for-every-state`: every library component file has a `*.stories.*` beside it.
  The test checks existence; whether each state has a story is advice.
- `doc-card`: every library component has `parameters.atomic` in its stories with a
  `status` and an `owner` (details: `no doc card`, `missing status`, `missing owner`).
  Existing components without a card go into the baseline with the rest.
- `i18n-no-hardcoded-strings`: JSX text with a letter, and string literals given to
  `aria-label`, `title`, `placeholder` and `alt`, in library files (details: the text, or
  `aria-label: Close menu`). `{t("x")}`, `{children}`, `<Trans>`, numbers and units are
  not flagged. Setup asks the scope and writes it as `i18n.scope`: `library` (default) or
  `app`, which also scans containers and pages (the map's `containers` and `pages`). Ask
  for `app` when the team wants no hardcoded string anywhere; offer `attributes`, `allow`
  (brand names) and `exempt` only when the first run shows hits that are not text. The
  existing hits are baselined with `ATOMIC_BASELINE_INIT=i18n-no-hardcoded-strings`
  (`ratchet.md`).

The generated tests import `node:fs`, `node:path` and use `__dirname`. If the repo type-checks
(a `tsc` script or CI step) and has no `@types/node`, add it as a dev dependency and
`"node"` to `types`; mention it in the summary. Do not use `any` in generated files: they
must pass the repo's lint.

Later changes add rules by appending one entry to `RULES` in the checker (see the
comment at its top); severities and the baseline then apply to them automatically.

**Check:** temporarily add `import { useQuery } from "@tanstack/react-query"` (or the
first entry of `dataModules`) to a library file; the unit suite fails naming the file and
the import. Revert.
