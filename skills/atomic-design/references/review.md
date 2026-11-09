# Reviewing a UI change

Run this flow when asked to review UI code, a branch or a pull request in a repo that has
`.atomic-design.json`, or through `/atomic-design:review`. It is read-only: it never edits a
file, never posts anywhere, and its output stays in the session for the developer to use.

The review finds what the tests cannot judge. It never repeats what the suite enforces.

## 1. Scope and inputs

| Input | What is reviewed |
|---|---|
| nothing | the working diff: `git diff HEAD` plus untracked files (`git status --porcelain`); read every untracked file whole |
| a git range, such as `main..HEAD` | that range |
| a branch name | the branch against its merge base with the main branch |
| a path | every file under it, as if all of it were added |

Read the map first: `levels`, `containers`, `pages`, `dataModules`, `rules`, `design`,
`team`, `review`, `tokens.grid` (default 4 when absent), `storybook.url` and `baseline`. Read
the card (the story file's `parameters.atomic`, `doc-card.md`) of every touched component,
and list the library from the level globs (or with the Storybook MCP tools when
`storybook.mcp` is true) for the near-duplicate check. Review only added and changed
lines, plus what those lines make wrong elsewhere (a removed component's usages, a card
that now disagrees with its component).

## 2. What the suite already owns

The suite (`tests.boundary`, `tests.stories`) enforces a rule at its severity in the map's
`rules`. Do not make a finding of any of these; point to the failing test instead.

| Severity in the map | What the review does |
|---|---|
| `error` | Under **Tests that fail**, one line per case: `boundary test fails: <rule-id> <file> <detail>`. Run `tests.boundary` when you may; otherwise say the failure is predicted from the diff. |
| `warn` | Under **Warned by the suite**, one line per case, so a warning is not lost. |
| `off` | Not mentioned. |

Cases the suite covers: a data module imported by a library file (`data-in-containers`, always
`error`); a library file importing a container or a page (`atomic-components`); a library
file with no story file (`stories-for-every-state`); a colour or font literal
(`tokens-only`); a missing card, `status` or `owner` (`doc-card`); a story missing a
translation key. A hunk the baseline already lists is known debt: not a finding, unless the
baseline grew (below).

## 3. Findings the tests cannot produce

Rule ids come only from `rules.md`. Where a check has no id of its own, it takes the nearest
one, as in this table.

| Check | Rule id | What to look for in the changed lines |
|---|---|---|
| Level fit | `atomic-components` | Run the placement questions of `levels.md` on each new or moved component and compare the answer with the folder it sits in. State the deciding question number in the finding, so a reviewer can dismiss it quickly. |
| Upward import | `atomic-components` | A library file imports a level above its own (an atom importing a molecule, a molecule importing an organism). ESLint covers this only for folders with distinctive names, and the suite not at all, so resolve the import and look at the map. |
| Missing story states | `stories-for-every-state` | A prop of the component itself allows a state no story shows (judge by the props, never by what a container does with them): `disabled`, `loading`, `error`, an array or `children` that can be empty, copy that can be long. The suite only requires a story file to exist. |
| `t()` bypassed | `i18n-no-hardcoded-strings` | User-facing text typed in JSX, a `title`, `aria-label` or `placeholder`, in a library file, outside `t()` and not from props. In a repo with no translation function, copy must arrive as props. |
| Spacing off the grid | `tokens-only` | A spacing value that is not a multiple of `tokens.grid` (default 4): an arbitrary Tailwind value such as `mt-[13px]`, an inline `padding: 13`. Scale classes are on the grid. Advice, not a failure. |
| Variant explosion | `single-responsibility` | A component with more than `review.maxVariantProps` (default 4) enum or boolean props after the change, counted as in `component.md` step 1. Propose the split. |
| Near-duplicate | `pattern-before-component` | A new component whose props shape or job matches one already in the library, under another name. Compare props and events, not names. Name the existing component and propose reuse, extend or a variant. |
| Container with markup | `single-responsibility` | A container (the map's `containers` glob) that renders its own elements or layout, or renders more than one library component. A container fetches, then renders one library component. Layout belongs to a template or a page. |
| Literal query key | `single-responsibility` | A `queryKey` array typed inline in a container. Keys come from one place, so invalidation reaches every user of the data. |
| Stale doc card | `doc-card` | `combinesWith` naming a component that no longer exists; a `stable` card with no `design` (or, in `code-first` mode, no `approvedBy`); `deprecated` with no `replacedBy`; a card that contradicts its component after the change (a removed prop named in `dos`). |
| Baseline grew | the entry's rule | `git diff` of the baseline file shows an added entry. The baseline only shrinks: the fix is the code, not the entry. |
| Deprecated component | `component-lifecycle` | A new import of a component whose card is `deprecated`, or a removed component that still has usages. See `lifecycle.md`. |

Also under `component-lifecycle`, as advice: a card that has been `experimental` for a long
time (check with `git log -S"experimental" -- <story file>`) is a prompt to ask the
reviewer, not a failure.

Report only the checks in this table. This is not a general code review: do not raise
formatting, plural forms, performance, naming taste or missing wiring that no rule above
names. A component that satisfies every row is a clean change. An existing import or usage
that the diff does not add is not a finding; it may be mentioned once in the closing line.

Each finding is one line:

`file:line - rule-id - what is wrong - fix`

Grouped by rule id, `file:line` pointing at the changed line (the import, the prop, the
literal). Findings are advice: nothing here fails a build. When a hunk is only borderline,
say so in the line instead of dropping it. A change with no finding gets the single line
`No findings.` and still ends with the sign-off list.

## 4. Output order

1. **Findings**, grouped by rule id, or `No findings.`
2. **Tests that fail** (suite rules at `error`), if any.
3. **Warned by the suite** (suite rules at `warn`), if any.
4. **For sign-off by `<design.reviewer>`**, always last.

## 5. The sign-off list

The list names the reviewer the map names: `design.reviewer`, which is the designer in
`figma` and `styleguide` modes and the named person or role in `code-first` mode. It
covers every story whose file changed, and every story of a component whose component file
changed. One entry per story:

```
For sign-off by designer
- Molecules/FilterBar > Selected - <url> - experimental - design: not yet agreed with design
```

- **Story id and link:** the story id is the title lower-cased without slashes joined to
  the export name in kebab case, so `Molecules/FilterBar` and `LongestCopy` give
  `molecules-filterbar--longest-copy`. The link is `<storybook.url>/?path=/story/<id>`;
  without `storybook.url`, use `http://localhost:6006` and say it is the local dev port.
  A new component's docs page is `?path=/docs/<title-id>--docs`.
- **Status:** the card's `status`. A `deprecated` card adds its replacement.
- **Design:** the card's `design`, or `not yet agreed with design` when empty
  (`code-first`: `not yet reviewed`).
- **Chromatic:** when the map's `review.chromatic` is set, add `build: <value>` to each entry,
  where the value is the Chromatic project or build URL pattern recorded there. Never set
  Chromatic up from here.
- **Visual snapshots:** when `visual.mode` is `local`, the baselines are images under
  `visual/baselines/`, named `<story-id>-<locale>-<theme>-<viewport>.png`, the story id with runs of dashes
  collapsed to one (`atoms-button--outline` becomes `atoms-button-outline`). For every
  baseline the diff adds, changes or deletes, put a line under the entry of the story whose
  collapsed id plus the `-<locale>-<theme>-<viewport>` ending makes the file name (a baseline whose
  story is not in the list gets an entry of its own):
  `visual: before <base>:<path> - after <path> - diff <path>`. `<base>` is the revision the
  diff starts from, so the reviewer opens the before image with `git show <base>:<path>` (do
  not extract it yourself; the review stays read-only). The diff image is
  `<name>-diff.png` under `visual/results/` (find it at any depth), listed only when that
  folder exists from a failed compare. A new baseline shows `after` only, a deleted one `before` only. When `visual.mode`
  is `chromatic`, the entry links the build as above and lists no images. When `off`, add
  nothing. Read `visual.md` in `atomic-setup` for the layout.
  - **Group by cause.** When more than five baselines changed, group them under the change
    that explains them: the token or style file in the same diff, or the component file.
    Show one cause, its count and the first three before/after pairs, and say where the rest
    are, so the reviewer approves a cause, not 300 images. Baselines that changed with no
    explaining source change in the diff go under their own heading,
    `Unexplained baseline changes`, as advice.

The list is ready to paste into a pull request. If the diff touches no story, say
`No stories changed.` under the heading.

## 6. Closing

Finish with the count of findings, the count of failing tests and the count of warnings.
Never report a test as run when it was not.
