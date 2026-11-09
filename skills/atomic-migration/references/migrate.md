# Migrating an area

`/atomic-design:migrate <area or component>` changes one area, or one component, per run,
and is scoped to one PR. It follows the decisions recorded in `docs/atomic-inventory.md` and
never changes behaviour. Read the map and the inventory first. No inventory: stop and
suggest `/atomic-design:inventory`.

## Before touching anything

1. **Resolve the target** to a row of the Areas table or a component row. Unknown: stop.
2. **Size.** More than 15 components in the area: ask to split it (by level, or by
   sub-folder) and wait.
3. **Undecided groups.** If any duplicate group with a member in the target has an empty
   Decision cell, stop and ask for the decision, naming the group and the members. Do not
   guess and do not pick the suggested one. A decision that is `merge into <Name>` without a
   `keep` survivor is undecided too.
4. **Green start.** Run the unit suite and the boundary test (`tests.unit`, `tests.boundary`).
   Red before the first change: stop and say which.
5. Note the baseline size and the working tree. Work on a clean tree. Do not create a
   branch or a commit: the developer does, one PR per run.

## Order inside an area

From atoms upward, one step at a time:

1. **Atoms:** map to the UI kit or move to the atoms path.
2. **Molecules**, 3. **organisms**, 4. **templates**: move to the level path the map names.
5. **Container splits** for the components that fetch.

Within a step:

- **Move or rename.** Use the TypeScript compiler's rename or move (the language service
  `getEditsForFileRename`) where available, so imports follow; else search every spelling
  (alias, relative, barrels) as in the lifecycle's finding-usages steps.
- **Merge.** Keep the survivor's API, take the structural name from the Structural name
  cell, and adapt every call site of the dropped component to the survivor. List each
  adapted call site in the summary with what differed (a prop mapped, a colour that changed).
  Remove the dropped component only when no usage remains (`lifecycle.md`); if some cannot
  be adapted safely, leave the component and say which.
- **Run the unit suite** after each step. Red: undo that step, report, stop.
- **Add what the rules want** for each component the run touches in the area: a story file
  with one story per state and a doc card, following `component.md` steps 6 and 7. Cards are
  `experimental`; the owner is the map's `team` (ask if there is none), the design source
  follows the design mode. Never set `stable`.
- **Baseline.** Remove the entries the step really fixed (a deleted file's entries, a
  fixed import, a story added for `no stories file`), then run the boundary test: it fails
  on a stale entry and on a new violation. Never add an entry.

## The container split

For a component that fetches (it is in a library level and imports a `dataModules` module):

1. Name the container with the map's `containers` glob, beside the feature (outside the
   level folders): `order-list.tsx` gets `order-list-container.tsx`.
2. The library component keeps its name and markup and loses the data code: the fetched
   values and the state its callbacks change come in as props, its actions go out as
   `onX(payload)` callbacks, and loading and error arrive as props. Do not add behaviour:
   a fetch error that was not handled before stays unhandled, and the summary says so.
3. The container holds the hook or client call and any state, and renders the component.
4. Replace the component's call sites (pages and containers) with the container.
5. The behaviour test that rendered the app stays as it was; only an import line may change.
   If the render needs a different test, stop and say so.
6. Remove the component's `data-in-containers` baseline entries and add its states as
   stories (loading, empty, with data) with a card.

## Test safety

Behaviour tests may change only their import lines. After the run:

```bash
git diff -U0 -- '*.test.*' '*.spec.*'
```

Every changed line must be an `import` (or `export ... from`) line. Any other changed line:
undo it, stop, and report; the code is what changes, not the test. New story and story-test
files are not behaviour tests.

## Progress

At the end of the run update the inventory header and rows: set Migrated on the moved,
merged and split components (a dropped one is removed from the table), recount `Components
migrated`, `Baseline entries` (now), and mark the area `done` in the Areas table when all of
its components are done. Run the unit suite, the boundary test and the story tests last, and the type check
(`tsc --noEmit`) when the repo has a `tsconfig`; unit tests do not check types. Say so when a
check could not run.

## Summary to the developer

- What moved, merged, split and removed, as paths.
- Each adapted call site, and each visual difference for the designer to look at (the
  stories that changed).
- The baseline before and after, and the test results as run.
- The next area in the inventory's order.
