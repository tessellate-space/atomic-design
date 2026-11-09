# Inventory

`/atomic-design:inventory` writes `docs/atomic-inventory.md` from `templates/atomic-inventory.md`.
It reads the code and runs nothing destructive. Rerunning refreshes the facts and keeps
everything people wrote (the Decision and Structural name columns, the Migrated column, the
first-inventory baseline count), matched by component name and path.

## What counts as a component

A `.tsx` file whose default or named export returns JSX, excluding stories, tests and test
setup files, and route files. Route files (the map's `pages` glob, or a router's route
modules) are listed apart, under Pages. A file with several components lists each one.
Search the whole `src`, inside and outside the level folders; a component outside every
level glob is listed with level `unplaced`, which is part of the finding.

## Usage count

The number of import sites outside the component's own story and test files, following
barrel re-exports (`export { X } from`, `export * from`) and aliases, as in the finding-usages
steps of the lifecycle (`lifecycle.md`). Count a file once per component, however many times
it uses it. Say in Notes when an import could not be resolved (computed or dynamic) and was
left out.

## Suggested level

Ask the placement questions of `levels.md` in order and record the number of the one that
decided it, with its words ("1 fetches", "6 otherwise"). The level is a suggestion; the
decision column is for people. A component that fetches is marked `Fetches: yes` (it imports
a module in the map's `dataModules`, or calls `fetch` or a client directly) and needs a
container, whatever its level.

## Per component facts

- **Stories**: a `*.stories.*` file beside it exports it.
- **Card**: the story meta has `parameters.atomic` (`doc-card.md`).
- **Baseline entries**: how many entries of the map's `baseline` file name this file.
- **Area**: the grouping migrate works in. A feature folder (`src/features/orders`) is one
  area; for the shared kit, each level folder is one (`src/shared/ui/mui`). A component
  outside both goes to the nearest folder with other components.

## Duplicate groups

Two components are grouped when either holds:

- **Name stem.** Split the PascalCase names into words; they share a stem when the shorter
  name's words are the tail of the longer's (`StatusBadge`, `UserStatusBadge`; `AppButton`,
  `PrimaryButton` share `Button`; `InfoCard`, `UserCard` share `Card`).
- **Shape.** At least 70% of their props match by name and type, and their JSX roots are
  similar (the same element or the same wrapped library component).

A component can be in only one group; join groups that overlap. Each group shows its members
side by side with props, usages and a screenshot. Suggest a decision with a reason, for
example "merge `UserStatusBadge` into `StatusBadge`: same props, same MUI `Chip` root". Name
a stem match that is probably not a duplicate as such ("shared name only; props differ").
The decision and structural-name cells stay empty: they belong to the workshop.

Also list, without a group, components with more variant or boolean props than
`review.maxVariantProps` (`single-responsibility`) in Notes: the workshop may want to split
them.

## Screenshots

When the repo has stories, build Storybook into a temp directory and capture each
component's default story with headless Chrome at 1280 wide:

```bash
STORYBOOK_DISABLE_TELEMETRY=1 npx storybook build -o "$TMP/sb"   # use the repo's build script
python3 -m http.server 8765 -d "$TMP/sb" &                        # serve it
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu \
  --hide-scrollbars --window-size=1280,800 --virtual-time-budget=6000 \
  --screenshot=docs/atomic-inventory/<Name>.png "http://localhost:8765/iframe.html?id=<story-id>&viewMode=story"
```

Read the story ids from `index.json` in the built output (the first story of the component's
title). Stop the server afterwards. On other systems use the Chrome or Chromium binary on
the path. Write the images to `docs/atomic-inventory/` and reference them from the Screenshot
cell. When the visual tooling of this plugin is set up in the repo, use it instead.

A component without a story, a repo without Storybook, no Chrome, or a failing build: the
cell holds a link to the file and the routes (page files) that reach it, and Notes states the
skip and its reason. Never leave a screenshot cell silently empty. A running app that needs a
login is not screenshotted; link the routes.

## Progress header

On the first write: `Components migrated: 0 of <total>`, `Baseline entries: <n> now, <n> at
the first inventory`, `Areas done: 0 of <areas>`. On a rerun keep the first-inventory count
and recount the rest. In a repo that is already part migrated, count components marked
migrated.
