# atomic-design

A Claude Code plugin that carries the atomic design method for React teams and adapts to
the repo it is installed in: it sets up Storybook, a boundary check and story tests, writes
components and reviews changes the atomic way, and migrates an existing product one area at
a time. Everything it writes keeps working when the plugin is uninstalled.

**Version 0.1.2.** MIT licence. Claude Code is supported and was exercised end to end on four sample apps (see the release check and the version matrix); Codex is untested.

## Who it is for

A tech lead or design-system owner who wants a React product, new or already in
production, to have a component library with clear levels (atoms, molecules, organisms,
templates), data kept out of the library, every state shown in Storybook and a reviewable
way to change it. It suits teams working with Claude Code (or, untested, Codex) and a
designer who signs off components; it works with Figma, a styleguide or code first.

## What you get

- **Guarantees in your repo.** A level map (`.atomic-design.json`) that says where each
  level lives and which modules count as data; a boundary test that fails when a component
  below a container imports data, when the library imports a container, or when a component
  lacks stories, a doc card or tokens; a baseline so an existing product starts green and
  can only improve; story tests in a real browser (or jsdom); ESLint overrides and an
  `AGENTS.md` rules block. These are plain files and tests, with no dependency on the plugin.
- **The everyday flow.** Ask for UI in plain words ("add a filter bar to the orders page").
  The agent asks the pattern questions, names the level and why, states the contract, writes
  the component, its stories, its doc card and a container only when data is needed, and
  runs the checks. `plan` rewrites a UI plan the same way.
- **Review.** `review` checks a diff against the rules the tests cannot check and ends with
  a sign-off list for the designer, with Storybook links and, with `visual`, before and after
  images.
- **Migration.** `inventory` lists every component with usage, duplicates and data fetching;
  a workshop decides; `migrate` changes one area per pull request and shrinks the baseline.

## Install

**From GitHub.** In a Claude Code session:

```
/plugin marketplace add tessellate-space/atomic-design
/plugin install atomic-design@atomic-design-marketplace
```

From a shell: `claude plugin marketplace add tessellate-space/atomic-design`, then
`claude plugin install atomic-design@atomic-design-marketplace`.

**For a whole team, pinned to a release.** Commit this to the repo's `.claude/settings.json`,
so everyone who clones it gets the same version:

```json
{
  "extraKnownMarketplaces": {
    "atomic-design-marketplace": {
      "source": { "source": "github", "repo": "tessellate-space/atomic-design", "ref": "v0.1.2" }
    }
  },
  "enabledPlugins": { "atomic-design@atomic-design-marketplace": true }
}
```

To update, change `ref` to a newer tag.

**Vendored into the repo**, when the team cannot reach GitHub from its machines:

1. Copy this repository (without `fixtures/`, which only the release check needs) to
   `tools/claude-plugins/atomic-design/`. It carries its own marketplace, `LICENSE` and version.
2. Register it in `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "atomic-design-marketplace": {
      "source": { "source": "directory", "path": "./tools/claude-plugins/atomic-design" }
    }
  },
  "enabledPlugins": { "atomic-design@atomic-design-marketplace": true }
}
```

To update, copy a newer release over it.

**To try it without installing**, clone this repository and start a session with
`claude --plugin-dir <clone>`.

If the commands are missing in the first session after installing, restart it once: the marketplace
is synced in the background. Then run `/atomic-design:setup`.

## Commands

| Command | Use it to | Section |
|---|---|---|
| `/atomic-design:setup` | set the library up in a new or existing repo; safe to rerun | Setup |
| `/atomic-design:foundations` | document the design tokens, add the Foundations story, ban colour literals | Foundations |
| `/atomic-design:component <what to build>` | build or change UI the atomic way | Component |
| `/atomic-design:plan <plan.md>` | add a Component levels table and story tasks to a plan | Plan |
| `/atomic-design:review [range]` | review a change and list what the designer signs off | Review |
| `/atomic-design:visual [local\|chromatic\|off]` | snapshot every story and approve image diffs | Visual |
| `/atomic-design:inventory` | inventory every component of an existing product | Inventory and migrate |
| `/atomic-design:migrate <area\|component>` | migrate one area or one component | Inventory and migrate |

### Setup

`/atomic-design:setup` sets the library up in a new or existing React repo and is safe to
rerun: every step probes first and reports "already in place". It edits no source file.

**What it writes** (all of it works after the plugin is uninstalled):

- `.atomic-design.json`, the level map. Setup proposes it from your existing folders
  and shows it before writing; nothing is moved.
- Storybook wiring on Vite: guarded plugins and the absolute alias in `.storybook/main`,
  a preview with locale and theme switches. An existing Storybook keeps its version and
  stories and is merged into, never reinstalled.
- A boundary checker in your `lib/` with its own fixture tests, and a test that runs it
  on your real tree. It fails on a data import below containers (`data-in-containers`),
  a library file importing a container (`atomic-components`) and a component without
  stories (`stories-for-every-state`).
- Story tests (below), a dev-config test (Vite only), a baseline file, ESLint
  overrides, and a rules block in `AGENTS.md` (plus a pointer in `CLAUDE.md`).

**ESLint** (when present, flat config): `no-restricted-imports` per level for data
modules, containers and, where folder names allow, upward imports; baselined files show
warnings. The legacy `.eslintrc` format is written by hand and untested.

**Storybook MCP** (Vite, Storybook 10.3+): offered; accepting runs
`npx storybook add @storybook/addon-mcp` and sets `storybook.mcp`.

**The hook** runs `tests.boundary` after edits under a library level, only when the map
has `hook.enabled: true` (default off). It needs the plugin installed; the tests do not.

**Non-Vite builders** (webpack, Next.js): the builder config is not touched and the
dev-config test is skipped; the map, boundary checks, baseline, ESLint, `AGENTS.md` and
`test-runner` mode still apply.

### Component

`/atomic-design:component <what to build>` builds or changes UI the atomic way. Asking in
plain words does the same when the repo has `.atomic-design.json`; the command is a
shortcut. The agent works in this order and stops where it needs you:

1. **Pattern questions.** Does this pattern exist, does it have variants, is it used
   consistently, does anything else serve the same purpose? When a component matches, it
   proposes extending, composing or a variant and waits. A component already at
   `review.maxVariantProps` variant props (default 4) gets a separate component
   proposed instead of one more variant.
2. **Design source.** A Figma frame, a styleguide entry, or in `code-first` mode the
   stories themselves; no design files are asked for there. Work never waits for a file.
3. **Placement, contract, component, stories, doc card, container, checks.** It names the
   level and why, states props, events and state ownership before the code, writes tokens
   and `t()` copy for every locale, one story per state, the card, a container only when
   data is needed, and runs the boundary and story tests.

Examples, from the fixture runs:

- "Add a filter bar to the orders page that filters by status" (a Figma repo, no link
  given). The agent finds no existing filter, places a **molecule**, `Molecules/FilterBar`,
  states its contract (controlled; `onChange(value | null)`), and writes stories for
  default, selected, empty, disabled and longest copy. "All" comes from a `t()` key
  added to `en` and `de`. The orders container owns the selected status and passes the
  options in. The card says `experimental`, owner `Web team`, and the docs page shows
  "not yet agreed with design". Boundary, story and unit tests pass.
- "A status filter for the invoices page" afterwards: the agent names `FilterBar`, proposes
  reusing it and stops. Once `FilterBar` has four boolean props (`review.maxVariantProps`),
  a request for a dropdown mode gets a separate `FilterSelect` proposed instead of a fifth.
- A `code-first` repo, "add a new summary card showing the total number of orders": no
  design file is asked for. `StatCard` is a molecule with `design: "storybook"` and
  `derivedFrom` naming the dashboard. The repo has no `t()`, so its copy arrives as props
  from the container. After "the tech lead approved it", the card gets `status: "stable"`,
  `approvedBy: "tech lead"` and `approvedOn`, and the docs page shows who approved it.

**The doc card** is `parameters.atomic` in the story file, shown on the component's docs
page above the props table:

| Field | Meaning |
|---|---|
| `status` | `experimental` (new or not yet approved), `stable` (approved by `design.reviewer`), `deprecated` |
| `owner` | who to ask; defaults to the map's `team` |
| `design` | Figma URL, styleguide entry, or `"storybook"` in code-first mode; empty shows "not yet agreed with design" |
| `flow`, `dos`, `donts`, `combinesWith` | what it is and where it sits, usage rules, neighbours |
| `approvedBy`, `approvedOn` | recorded when the reviewer approves it for `stable` |

Status is an agreement between design and development, not a grade. A component is
`experimental` until you say the reviewer approved it; the agent never promotes it alone.
The `doc-card` rule fails the suite for a component without a card, a `status` or an
`owner`; components that had no card when setup ran are in the baseline. A repo set up
before the rule existed gets the same baseline by rerunning setup, which records only the
new rule's entries (`ATOMIC_BASELINE_INIT=doc-card`).

### Plan

`/atomic-design:plan <plan.md>` edits only the plan file. It adds a Component levels
table (component, level, props in, events out, controlled, container, reuses, design
source, status) and rewrites UI tasks as one stories-and-card task per component: the
template and organism interfaces first, then atoms up, containers last. For "an orders
dashboard" it produced a six-row table and eight tasks: two interface tasks, five
stories-and-card tasks (atom `StatTile`, molecules `StatGroup` and `RefreshControl`,
organisms `OrderList` and `OrdersDashboard`), then one for the container and page. The
reused `FilterBar` got a row and no task.

### Review

`/atomic-design:review [git range | branch | path]` reviews a change against the rules the
tests cannot check. With no argument it reviews the working diff. It is read-only: it edits
nothing and posts nothing, and its output stays in the session for you to paste.

What it reports, each as `file:line - rule-id - what - fix`, grouped by rule id:

- level fit (the placement question that decided it is named, so a reviewer can dismiss it),
  and upward imports that ESLint does not cover;
- story states a component's props allow but no story shows;
- text that bypasses `t()`, and spacing off the grid (`tokens.grid`, default 4);
- variant explosion (more than `review.maxVariantProps` variant or boolean props) and
  near-duplicates of an existing component, compared by props and not by name;
- containers that render markup, and query keys typed inline;
- stale doc cards (`combinesWith` naming a removed component, a `stable` card with no
  design link) and a baseline that grew;
- new imports of a deprecated component, and removals that leave usages behind.

Anything the suite already enforces is not a finding. At `error` it appears under **Tests
that fail** ("boundary test fails: data-in-containers refresh-button.tsx ~/lib/api"); at
`warn` under **Warned by the suite**; at `off` it is not mentioned. A change that follows every
rule gets `No findings.`

Every review ends with **For sign-off by `<design.reviewer>`**: one line per added or changed
story (and per story of a changed component) with its Storybook link, the card's status and
the design source, ready to paste into the PR. Links use `storybook.url` from the map, or the
local dev port `http://localhost:6006`; with `review.chromatic` set, each line adds that
Chromatic build URL. Chromatic is linked, never set up.

Examples, from the seeded cases in `fixtures/review-cases/`:

- A patch with thirteen seeded problems: every one came back with its file and rule (a
  labelled input in the atoms folder, a molecule importing an organism, a fifth boolean on
  `FilterBar`, a `StatusPicker` that repeats `FilterBar`, a container wrapping its component
  in a `section`, a `queryKey` typed inline, a `stable` card with no design link naming a
  component that does not exist, two baseline entries added for a new file). The molecule that
  calls `fetchOrders` came back under **Tests that fail**, not as a finding. A type-only
  `import type { Order } from "~/lib/api"` is not a data import and is left alone.
- With `rules.doc-card` set to `warn`, a new component with no card is listed under **Warned
  by the suite**.
- A correct molecule with its container, stories and card: no findings, and a sign-off list of
  its four stories.

### Lifecycle

Every doc card has a status, an agreement between design and development
(`references/lifecycle.md`):

| Move | Rule |
|---|---|
| `experimental` to `stable` | only when you say `design.reviewer` approved it; the card records `approvedBy` and `approvedOn` |
| to `deprecated` | only with a named replacement: `status: "deprecated"` and `replacedBy` on the card; the docs page shows a banner and the review flags any new import |
| change to a `stable` component | the agent lists the usages and asks whether the change is breaking before editing; it offers a new variant, a new component, or updating every usage in the same change |
| removal | only when nothing uses it; otherwise the usages are listed and migration is offered first |

Examples, from the fixture runs:

- "Rename the required prop `label` of `FilterBar` to `groupLabel`", with `FilterBar` stable
  and used in five places: nothing is edited; the agent lists the five usages (the orders
  container and four pages), the stories and the plan row, and offers the three ways.
- "Remove the `FilterBar` component": nothing is deleted; the five usages are listed with what
  would go with it, and deprecating first is offered.
- `FilterBar` deprecated in favour of a new `FilterSelect`: the card shows `deprecated` and the
  replacement, the docs page renders the banner, and a review of a page that newly imports
  `FilterBar` reports it with `FilterSelect` as the fix. The orders container's existing
  import is not a finding.

A repo set up before the banner existed copies the current `atomic-docs-page.tsx` template
over `.storybook/atomic-docs-page.tsx`.

### Foundations

`/atomic-design:foundations` documents the design tokens, adds a live page for them and
keeps colour literals out of the library. It needs the level map from setup and is safe to
rerun.

**Sources it detects**, in this order, recorded as `tokens.source` with `tokens.path` in
the map: `css-vars` (custom properties in the stylesheet), `tailwind` (an `@theme` block or
the config) and `theme-object` (`createTheme` or a `ThemeProvider` theme, for MUI and
similar kits). With two sources it asks which is canonical and lists the other as a
finding. Tokens that exist are used as they are; nothing is invented.

**No tokens.** In `figma` or `styleguide` mode it asks where the design source is and
creates tokens from it. In `code-first` mode it proposes them from your code:
`skills/atomic-setup/scripts/cluster_tokens.py` collects every colour literal in the repo,
clusters them by perceptual distance (OKLab, default deltaE below 3), rounds spacing and
radius values to the grid, and writes `docs/foundations-proposal.md`: each token, its value
(the most-used member), the literals it absorbs and their usage counts. The command then
stops. Only after the reviewer named in `design.reviewer` approves (and splits any merge
that looks wrong) are the tokens written in the detected format, `tokens-only` set to
`error` and the existing literals baselined. Components are not edited; each later
migration removes baseline entries.

**The guidance file.** `docs/foundations.md` is drafted from the token names and how the
code uses them ("`--color-brand` is used on 14 buttons"): colour by role (surface, text,
accent, state, border), type, spacing grid, radii and elevation, each with "use for" and
"never for". What the code cannot back is marked `needs design input`; the agent never
presents an invented rule as settled. The file stays a draft: review it with design.

**The story.** `Foundations/Tokens` renders colours, type, spacing, radii and elevation
from the page at render time (computed custom properties) or from the imported theme
object. It is not a copied list, so a token added to the source appears without editing the
story. Tailwind 4 emits only the theme variables something uses; to show unused tokens too,
change `@theme` to `@theme static` (the command asks first). In `portable` story-test mode
the story only checks that the page renders, because jsdom has no compiled stylesheet.

**The literal rule.** `tokens-only` fails the suite on a colour literal (`#hex`, `rgb()`,
`hsl()`, `oklch()` and similar) or an ad-hoc `font-family` in a library-level `.ts`, `.tsx`,
`.js`, `.jsx` or `.css` file, skipping tests, stories and containers. One violation per
distinct literal per file. Exemptions, each a hole worth reporting: the files listed in
`tokens.path` (the token definitions) and the globs in `tokens.exempt` (for example
`**/icons/**`). Existing literals are recorded once with
`ATOMIC_BASELINE_INIT=tokens-only <tests.boundary>`, which adds only that rule's entries to
an existing baseline and refuses to run again once the rule has entries. Spacing against the
grid is not tested (too many false positives); it becomes a review rule later.

### Inventory and migrate

For a product that already exists. Needs a repo set up with `/atomic-design:setup`.

**`/atomic-design:inventory`** scans every component, inside and outside the level
folders, and writes `docs/atomic-inventory.md`: path, usage count (following barrels),
suggested level with the deciding question, whether it fetches data, has stories and has a
card, its baseline entries, and groups of likely duplicates (a shared name stem, or props
at least 70% the same with a similar JSX root). Screenshots come from the stories (a
Storybook build and headless Chrome at 1280 wide); with no stories, Chrome or Storybook the
entry links the file and the page that reaches it, and the notes say why. It suggests a
decision for each group and leaves the **Decision** (`keep`, `merge into <Name>`, `drop`,
`rename`) and **Structural name** columns empty.

On the `legacy-app` fixture it found 8 components in 5 areas, three groups (`StatusBadge`
and `UserStatusBadge`; `AppButton` and `PrimaryButton`; `InfoCard` and `UserCard`, a shared
name the suggestion called "keep both"), `OrderList` and `UserCard` as fetching, 21
baseline entries, and no screenshots because the app has no stories.

**`/atomic-design:migrate <area | component>`** changes one area (or one component) per
run, one PR. It refuses an area that has a duplicate group with an empty decision, asks to
split an area of more than 15 components, and starts only from a green suite. Inside an
area the order is atoms, molecules, organisms, templates, then container splits. Each step
moves or merges (imports follow; call sites of a dropped component are adapted and listed),
adds stories and an `experimental` card, removes the baseline entries it fixed, and runs
the suite. A component is deleted only when no usage remains (the lifecycle rule).
Behaviour tests may change only their import lines; the run checks that with `git diff` on
the test files. It ends by updating the inventory header: components migrated, baseline now
and at the first inventory, areas done.

From the fixture runs on `legacy-app` (decisions in `fixtures/legacy-app/DECISIONS.md`):

- `migrate src/shared/ui/mui`, with both duplicate groups decided: `PrimaryButton` merged
  into `AppButton` and `UserStatusBadge` into `StatusBadge`; their two call sites adapted
  (one visible difference listed: the `closed` chip's grey); stories and cards for the two
  survivors, with colours moved onto theme values; baseline 21 to 13; the app test untouched; suite green; header 1 of 5 areas.
- `migrate src/shared/ui/composite` with the `InfoCard`, `UserCard` group undecided: it
  stopped, named the group and its members, and changed nothing.
- `migrate OrderList`: a presentational `OrderList` (`orders` and `onClear` props), an `OrderListContainer` holding the fetch and the list state, the page
  rendering the container, three stories and a card, baseline 13 to 11; the app test
  unchanged.

### Visual

`/atomic-design:visual [local | chromatic | off]` snapshots every story, so a reviewer
approves image diffs instead of opening each story. It sets `visual.mode` in the level map
(default `off`). Reference: `skills/atomic-setup/references/visual.md`.

- **`local`.** Baselines are committed PNGs in `visual/baselines/`. Two commands, both run
  through one script, `scripts/visual.sh`:
  - `sh scripts/visual.sh update` rewrites the baselines.
  - `sh scripts/visual.sh compare` fails on any difference and names the stories.
- **Capture follows the test mode.** `vitest-addon` repos use Vitest 4 browser mode
  (`expect.element(locator).toMatchScreenshot()`, in a third Vitest project, `visual`).
  `test-runner` and `portable` repos use a Playwright spec against `storybook build`.
  Chromium only, stories only.
- **Docker.** The script runs the capture inside `mcr.microsoft.com/playwright:v<version>-noble`,
  pinned to the Playwright version in the lockfile, and CI runs the same script, so fonts and
  anti-aliasing match on every machine. It needs Docker locally; without it, update baselines
  from the CI job. Animations are off, fonts are awaited, the viewport is fixed (desktop
  1280x800; `mobile` is 390x844 and is opt-in through `visual.viewports`).
- **The matrix.** The default locale x every theme, plus the longest locale (most characters
  in its catalog). `visual.matrix: "all"` covers every combination. A story opts out with
  `parameters: { visual: false }`; list the opt-outs when reporting.
- **LFS.** Past `visual.lfsThresholdMb` (default 20) the baselines move to Git LFS; the
  command writes `.gitattributes` and says so.
- **Updating baselines.** An intended change updates the baselines in the same pull request.
  An unintended diff fails the `visual` CI job. `/atomic-design:review` lists the changed
  baselines in the sign-off list with before and after images (and the diff image, when a
  failed `compare` left one), grouped by cause when there are many.
- **Upgrade to Chromatic.** `/atomic-design:visual chromatic` adds the Chromatic CI step and
  sets `visual.mode: chromatic`. Stories do not change. The project token is the team's
  CI secret `CHROMATIC_PROJECT_TOKEN`; the plugin never creates an account or stores a token.
  Local baselines are removed only after the developer confirms. Chromatic also publishes a
  Storybook MCP endpoint (docs tools) for each published Storybook; see Chromatic's MCP
  documentation. The plugin does not wire it.

## The level map

`.atomic-design.json` at the repo root is the only file later steps and commands read. Its
format is `schema/atomic-design.schema.json`; `python3 scripts/check_plugin.py
--validate-map .atomic-design.json` checks one.

**Rule severities and the three tiers.** `rules` in the map sets `error` (fails the
suite), `warn` (printed on every run, never fails) or `off` per rule.
`data-in-containers` is always `error`; the baseline is the only way to relax it. The
suite decides what a machine can decide; ESLint shows data and upward imports in the
editor; review only advises on judgment.

**Hardcoded strings.** `i18n-no-hardcoded-strings` fails the suite on JSX text that contains a
letter (including `<span className="sr-only">Close</span>`) and on string literals given to
`aria-label`, `title`, `placeholder` and `alt`. `{t("key")}`, `{children}`, `{props.label}`,
`className`, `data-*`, `<Trans>` content, numbers and units are not flagged. The check is a
text scan, not a parse; it does not look inside `{}` expressions. The optional `i18n` block sets
`scope` (`library`, the default, or `app`, which adds containers and pages), `attributes` (replaces
the default list), `allow` (exact strings such as a brand name) and `exempt` (globs). Record
existing hits once with `ATOMIC_BASELINE_INIT=i18n-no-hardcoded-strings`. A repo set up with
0.1.0 copies the new checker from `skills/atomic-setup/templates/lib/` by hand, then does this.

**Design modes.** Setup asks whether you work from Figma, a styleguide or code first,
and who approves components, and records `design.mode` and `design.reviewer`.

**Story-test modes**, chosen per repo and recorded in `tests.mode`:

| Mode | Chosen when | Run | CI |
|---|---|---|---|
| `vitest-addon` | Vite and Vitest 4 (or the upgrade accepted) | `npx vitest run --project=storybook` | install the browser: `npx playwright install chromium` (on Linux CI also its system libraries) |
| `test-runner` | non-Vite builder | `npm run test:stories` (build, serve, `test-storybook`) | same browser install; builds once, then serves the static output |
| `portable` | Vite with Vitest 3 or Jest, no upgrade | part of the unit suite | nothing extra; weaker, because jsdom misses layout and CSS faults |

`vitest-addon` runs every story as a test in headless Chromium, with play functions and
`addon-a11y` checks (reported per story under `rules.a11y`, default `warn`).
On Vitest 3 setup offers the Vitest 4 upgrade as a separate step that stops on the first
failure; declining records `portable` with a note. `portable` renders every story per
locale x theme and fails on a missing translation key, a `console.error` or a failing play
function. If the repo's test reporter fails on todo or skipped tests, setup detects it (or asks),
and renders the portable empty-suite guard as a passing test, so no generated test is a todo.
`rules.a11y: warn` stays available in every mode: in `vitest-addon` the addon's a11y todo never
reaches Vitest's reporter (checked on addon-vitest 10.6.5 and Vitest 4.1.12). CI job snippets per mode are in `skills/atomic-setup/templates/ci/` (not run in
CI by the fixture runs).

## The baseline

**The baseline.** Existing violations are recorded once in `.atomic-design-baseline.json`
so the suite is green on day one. After that the suite fails on any violation not in the
file, and on any entry that no longer occurs ("remove this entry from the baseline:
fixed"). The list can only shrink; an empty file is the goal. Rules at `warn` print a
summary on every run; Vitest 4 hides console output of passing tests when it detects an AI
agent, so use `--reporter=default` to see it there.

## The workshop

**The workshop** is 60 to 90 minutes with design and development, spent deciding
(`skills/atomic-migration/references/workshop.md`):

| Time | What |
|---|---|
| 10 minutes | the goal and the glossary |
| 40 to 60 minutes | decide the duplicate groups, largest usage first: does the pattern exist, does it have distinct variants, is it used consistently, does anything else serve the purpose; name the survivor by its structure |
| 10 minutes | pick the first area (fewest usages, most duplicates) and the order of the rest |

Its output is the edited inventory, committed. The plugin prepares and records; people decide.

## Codex

**Status: untested.** The Codex CLI was not available when this version was prepared, so
the skills were not loaded or exercised in Codex. Nothing here claims it works.

What is prepared: `.codex-plugin/plugin.json` sits beside `.claude-plugin/` and points at
the same `skills/`, in the manifest layout OpenAI documents for Codex plugins
(`developers.openai.com/codex/plugins/build`). Whether Codex installs it as written is not
verified. The commands (`/atomic-design:...`) are Claude Code only; in Codex the three
skills (`atomic-design`, `atomic-setup`, `atomic-migration`) route the same intents from
plain words.

Fallback: copy the three folders under `skills/` into a folder Codex scans for skills.
OpenAI's skills documentation lists `.agents/skills` in the repo (and `$HOME/.agents/skills`
for your user); some Codex versions used `~/.codex/skills/`, so check where your version
looks:

```
mkdir -p .agents/skills && cp -R <plugin>/skills/* .agents/skills/
```

Skills refer to the plugin's scripts and templates with `${CLAUDE_SKILL_DIR}`; in Codex,
read that as the skill's own folder. "Supported" will mean: the skills list in Codex shows
all three, the knowledge questions from the core skill are answered as in Claude Code, and
a plain filter-bar request follows the component flow.

## Changes in 0.1.2

- Setup names the level map by its real path. In a monorepo with the map at
  `frontend/.atomic-design.json` and `AGENTS.md` at the repo root, the rules block and the
  `CLAUDE.md` pointer say `frontend/.atomic-design.json` (the `{{map_path}}` fact).
- A strict reporter (one that fails on todo or skipped tests) no longer takes `rules.a11y: warn`
  away in `vitest-addon` mode; only portable mode's empty-suite guard changes. Checked on
  addon-vitest 10.6.5 and Vitest 4.1.12. `references/test-modes.md` had lost its mode-selection and
  per-mode sections in the 0.1.2 edit; they are restored. The root `AGENTS.md` rules block of a
  monorepo now says to run its commands from the package folder (`docs_outside_package`,
  `{{package_dir}}`), and no longer calls the unit command "everything". The full release check
  was rerun on 0.1.2; see the version matrix.

## Release check

Nothing is released until this checklist passes in fresh sessions on scratch copies of the
four fixtures. Copy each fixture from `fixtures/` to a scratch folder (no `node_modules`),
run `git init` and commit inside it so every step can be diffed, then `npm ci`. Start each
session with `claude --plugin-dir <plugin folder>`; set `STORYBOOK_DISABLE_TELEMETRY=1`. On
Vitest 4 add `--reporter=default` to see warnings from passing tests. Run an app's steps in
order; if one fails, fix the plugin and rerun that app from step 1. Each step names the
earlier change's check it repeats (`setup 3.1` is task 3.1 of the setup change); the version
matrix gains a row only when every step passed. The same text is used for every version.

**sample-app** (`vitest-addon`; Figma, reviewer "design lead", team "Web team")

1. `/atomic-design:setup`, accepting the Vitest 4 upgrade and the hook. Expect: a valid map; every step's check passed; no `{{` or `atomic:` in written files; files reference `src/`, `~` and `en`/`de`; unit suite, `--project=storybook` (green with no stories) and `storybook build` pass; a story renders in `storybook dev` with German copy and dark tokens. Piping a failing boundary command into the hook exits 2 (`setup 2.2`, `3.1`). Rerun: every step "already in place", `git status` unchanged (`setup 3.2`).
2. A `@tanstack/react-query` import in a molecule fails the boundary test and is reported by the hook (`setup 3.1`); with ESLint present, by ESLint too.
3. `/atomic-design:foundations`. Expect: source `tailwind`; `docs/foundations.md` with every group and unbacked items marked; the Foundations story picks up a token added afterwards; a hex in a molecule fails with `tokens-only` (`foundations 2.1`).
4. In plain words: "add a filter bar to the orders page that filters by status". Expect: a molecule with a stated contract, default, empty and longest-copy stories, a card marked `experimental`, `t()` keys in `en` and `de`, data only in the orders container, checks reported (`component 2.1`). Then "a status filter for the invoices page" proposes reusing it; with the variant props at the maximum a further one proposes a separate component (`component 2.2`). Removing the owner from the card fails the suite with `doc-card` (`component 2.3`).
5. `/atomic-design:plan` on a stub orders-dashboard plan: all table columns, one stories-and-card task per component, interfaces before atoms (`component 2.4`).
6. `/atomic-design:review` on each patch in `fixtures/review-cases/`, each applied to its own copy of the state `expected.md` describes: every seeded finding by file and rule for `violations.patch`; the deprecated-import finding and a refused removal for `lifecycle.patch`; no findings for `clean.patch`; the data-import hunk as "boundary test fails"; each run ends with the sign-off list; with `doc-card` at `warn`, the missing card appears under "Warned by the suite" (`review 2.1`, `2.2`). Lifecycle: deprecating the filter molecule gives the card, banner and finding; renaming a required prop of a stable component lists usages before any edit (`review 2.3`).
7. `/atomic-design:visual local`. Expect: baselines for the default locale in both themes plus the longest locale; a second `sh scripts/visual.sh compare` shows no diff; a token change fails `compare` naming the stories; after `update`, `review` shows before and after images (`visual 2.1`). `/atomic-design:visual chromatic` as a dry run: the CI step reads the token from secrets, the map says `chromatic`, no story file changed, local baselines stay until confirmed (`visual 2.3`). No network call is made.

**sample-app-storybook** (existing Storybook)

8. `/atomic-design:setup` twice. Expect: Storybook version and both stories unchanged, config merged, and the second run changes nothing (`setup 3.2`).

**legacy-app** (`portable`, `code-first`)

9. `/atomic-design:setup` declining the Vitest upgrade. Expect: the map reuses the app's folders; `portable` with the weaker-mode note; a green suite whose baseline lists exactly the fetching and story-less components of `SEEDED.md`; a new data import fails the suite; fixing one seeded component fails it until its entry is removed; `doc-card` at `warn` lists a missing card and passes; `data-in-containers` at `off` fails schema validation (`setup 3.3`, `3.5`, `3.6`). The generated story harness lists every locale in the map (never an empty list).
10. `/atomic-design:foundations` with the MUI theme's colours removed: the proposal clusters the scattered greys into fewer tokens with counts, nothing is written before approval, and after approval the tokens exist and the literals are baselined (`foundations 2.3`). With the theme intact: source `theme-object` and the story renders it (`foundations 2.2`).
11. A new summary card in plain words: no design file requested, card source `storybook`, status `experimental`, then `stable` with `approvedBy` after "the tech lead approved it" (`component 2.5`).
12. `/atomic-design:inventory`: every group and fetching component of `EXPECTED-INVENTORY.md`, decision columns empty, screenshots or the stated skip (`migration 2.1`). Fill in `DECISIONS.md`, then `/atomic-design:migrate` on one area: suite green, baseline shrank, test diffs are import lines only, one survivor per merged group with stories and a card, inventory header updated. An area with an undecided group stops and asks; migrating one fetching component splits it into presentational and container with the behaviour test unchanged (`migration 2.2`, `2.3`). Files that `SEEDED.md` rows 4 and 6 name are deleted by the migration, so do not recheck them afterwards.
13. `/atomic-design:visual local`: baselines captured from `storybook build`, a second run shows no diff (`visual 2.2`).

**webpack-app** (`test-runner`)

14. `/atomic-design:setup`: mode `test-runner`, the builder config untouched, `npm run test:stories` passing against the built Storybook (`setup 3.5`). `/atomic-design:visual local`: baselines from `storybook build`, a second run with no diff (`visual 2.2`).

**Since 0.1.0** (steps 15 to 19 repeat the `atomic-plugin-i18n-check` and `atomic-plugin-map-path` changes; run each on the app named, after that app's earlier steps)

15. *sample-app, `library` scope* (`i18n-check 1.1`, `2.1`): the map has no `i18n` block. A `<button>Close</button>` in an atom fails the suite with `i18n-no-hardcoded-strings: <file> Close`, and `aria-label="Close menu"` with detail `aria-label: Close menu`. `{t("close")}`, `<Trans>Hello</Trans>`, `42%` and `·` pass. A hardcoded `aria-label` in a container passes.
16. *sample-app, `app` scope* (`i18n-check 1.1`, `2.1`): setting `i18n.scope` to `app` makes the container string fail. `ATOMIC_BASELINE_INIT=i18n-no-hardcoded-strings` appends the existing hits and the suite passes; fixing one hit fails as a stale entry until removed. Adding the exact string to `i18n.allow` stops it being reported. With the rule at `warn`, hits print and the suite passes.
17. *legacy-app with a strict reporter* (`i18n-check 2.2`): a Vitest or Jest reporter that fails on todo or skipped tests is present. Setup detects it (or is told), explains that `warn` is unavailable for `rules.a11y`, offers `error` or `off`, and records the choice. The portable empty-suite guard is a passing `it("no stories yet", () => {})`; no generated test uses `it.todo` or `test: "todo"`, and a zero-story run passes.
18. *sample-app with a strict reporter, `vitest-addon`* (`map-path 2.1`): with a reporter that fails on todo, `rules.a11y: warn` is kept, a story with an a11y violation is reported, and the run passes.
19. *monorepo variant* (`map-path 1.1`): `sample-app` moved under `frontend/`, `AGENTS.md` at the scratch root. Run setup step 1 only. `AGENTS.md` and `CLAUDE.md` name `frontend/.atomic-design.json`, and the map is at that path. A root-map app (step 1) names `.atomic-design.json`, unchanged.

**Uninstall**

20. Run the sample-app copy again without `--plugin-dir`. Expect: no generated file mentions the plugin; the suite still fails on a forbidden import and on a story that throws (`setup 3.4`).

**Plugin checks (once):** `python3 scripts/check_plugin.py` and `--self-test` pass; every command appears in the slash-command list of a session started with `--plugin-dir`; the install steps in this README work in a scratch vendored copy (`scaffold 6.1`); Codex status is stated.

## Version matrix

A row is added only when every step of the release check passed. Versions are the ones the
fixtures resolved and the run used.

| Plugin | Date | Storybook | Vite | webpack | React | Vitest | Jest | Playwright | ESLint | Node | Claude Code |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0.1.0 | 2026-11-05 | 10.6.5 | 8.3.6 | 5.112.2 | 19.3.1 | 4.1.12 (3.2.7 on the portable apps) | 30.5.2 | 1.64.1 (image `v1.64.1-noble`) | 9.39.5 | 25.6.1 | 2.1.318 |
| 0.1.2 | 2026-11-06 | 10.6.5 | 8.3.6 | 5.112.2 | 19.3.1 | 4.1.12 (3.2.7 on the portable apps) | 30.5.2 | 1.64.1 (image `v1.64.1-noble`) | not exercised | 25.6.1 | 2.1.318 |

Also used: `@storybook/test-runner` 0.26.0 on the webpack app, Docker 27.5.1 for the visual
image. Codex: not run (see Codex above).

0.1.2 run notes: ESLint is not installed in any fixture, so the ESLint steps (the override, and the
second path to a boundary failure in step 2) were skipped, not run; the column says so. Playwright
1.65.0 was current on the day and a fresh `vitest-addon` setup pins it, but the Docker daemon in the run
could not pull `v1.65.0-noble`, so `sample-app` and `webpack-app` were pinned to 1.64.1 (an `overrides`
entry on the webpack app) to match the one local image, and every visual capture used
`v1.64.1-noble`. The headless runs could not set environment variables, so baselines were written by
calling the checker's `initBaseline` from a throwaway test, and the step 15/16 i18n checks and some
probes (forbidden import, hex colour, missing owner, throwing story, the hook) were run by hand with
the same commands the checklist names. In the legacy-app card step the agent reuses `InfoCard`
and adds no library component, as in 0.1.0; the SummaryCard-as-component path was run separately.
`review` was run on `fixtures/review-cases` patches applied to a `sample-app` set up with 0.1.2 and
the 0.1.0 `FilterBar` overlay (four boolean props): every seeded finding by file and rule id,
no finding for the type-only import, and hunk 4 now appears under "Tests that fail" because the
checker flags it (`expected.md` says so). The Chromatic step was a dry run; the vendored install
was validated with `claude plugin validate` and not registered, because registering writes user-global
config.

Newer upstream releases seen on the same day, recorded and not adopted: Storybook and
`@storybook/addon-vitest` 10.6.6 (fixtures: 10.6.5), Vitest 5.1.0 (4.1.12), Playwright 1.65.0 (1.64.1).
Vite 8.3.6 and React 19.3.1 are current.

Not covered by the run, and not claimed: Next.js, Vite apps on Jest, `.eslintrc` (legacy
ESLint) configs, Windows, and the Chromatic service itself (dry run only).

## Lint

```
python3 scripts/check_plugin.py             # lint the plugin
python3 scripts/check_plugin.py --self-test # clean and failing cases for every rule
```

## Licence

MIT, copyright Radu Buta 2026. See `LICENSE`.

Distilled from a 2024 cross-disciplinary atomic design study group and production use.
