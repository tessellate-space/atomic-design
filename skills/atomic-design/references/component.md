# Building or changing a component

Follow this flow whenever someone asks to build, add or change UI in a repo that has
`.atomic-design.json`, in plain words ("add a filter bar to the orders page") or through
`/atomic-design:component`. The command is only a shortcut. Read the map first: `levels`,
`containers`, `dataModules`, `locales`, `themes`, `team`, `design` and `review`.

A request to change a `stable` component, to deprecate one, or to remove one is not a
new-component request: follow `lifecycle.md` (usages first, the answer before any edit)
and come back here only for the files it tells you to write.

Order matters. Nothing is written until step 1 is answered and, where a match exists,
confirmed.

## 1. Pattern questions (`pattern-before-component`)

List the library: from the map's level globs, each component's story title, its props and
the `combinesWith` of its card. When `storybook.mcp` is true, use the Storybook MCP tools
`list-all-documentation` and `get-documentation` instead. Search for the request's nouns
and for components of the same shape (similar props), not only the same name.

Answer in a short table:

| Question | Answer |
|---|---|
| Does this pattern already exist? | the component, or none |
| Does it have distinct variants? | which |
| Is it used consistently? | where, and where it is rebuilt by hand |
| Does anything else serve a similar purpose? | which |

When one component covers most of the request, propose **extend**, **compose** or **a new
variant** and stop. Write nothing until the developer confirms.

A new variant is refused when the component already has `review.maxVariantProps` variant
or boolean props (default 4): propose a separate component instead
(`single-responsibility`). Count every enum or boolean prop (`variant`, `size`, `compact`,
`disabled`, `withIcon`), not data props such as `label` or `value` and not callbacks such
as `onChange`.

## 2. Design source and status

The design source goes in the card's `design` field, by `design.mode`:

| Mode | Ask for | `design` holds |
|---|---|---|
| `figma` | a link to the frame | the URL |
| `styleguide` | the styleguide entry | its path or URL |
| `code-first` | nothing | `"storybook"`, plus `derivedFrom` naming the existing screen it came from, when there is one |

Never ask for design files in `code-first` mode, and never hold work for a design file in
any mode. Without a source, leave `design` out: the docs page then says "not yet agreed
with design" (code-first: "not yet reviewed").

Status is `experimental` on creation, in every mode. It becomes `stable` only when the
developer says `design.reviewer` approved it; then set `approvedBy` (the reviewer's role or
name) and `approvedOn` (today's date). Never set `stable` on your own
(`component-lifecycle`; moves between statuses: `lifecycle.md`). Details of every field:
`doc-card.md`.

## 3. Place it

Ask the placement questions in `levels.md` and say the level, the question that decided it
and why. A component that stays in a feature folder says why. Name it for what it is, not
for the screen where it first appears (`structural-names`).

## 4. Contract, before any code

State four lines, then continue:

- **Props in**, with types.
- **Events out**, as `onX(payload)`.
- **State**: controlled, uncontrolled, or controlled with a default.
- **Stories**: the states that need one (default, empty, loading, disabled, error, longest
  copy).

For an organism or template, write the contract first and build its children bottom-up.

## 5. Write the component

Tokens only (`tokens-only`). Copy through `t()`, with keys added to every locale in the
map (`i18n-no-hardcoded-strings`). A repo with no translation function: the copy arrives as props from the
container, and the flow says so instead of adding an i18n library. Imports from its own level and below
(`atomic-components`). No data module (`data-in-containers`). Reuse the atoms the UI kit
already has.

## 6. Stories (`stories-for-every-state`)

One story per applicable state from the contract. Title `<Level>/<Name>`. `args` are plain
data and no-op callbacks. Every story reads under each locale and theme, which are toolbar
globals, not extra stories. The longest-copy story uses the longest locale's text.

## 7. Doc card (`doc-card`)

Put `parameters.atomic` in the story file's meta. Fill `status`, `owner`, `design`,
`flow`, `dos`, `donts` and `combinesWith` (`doc-card.md`). `owner` defaults to the map's
`team`; when the map has none, ask, never guess a person.

## 8. Container, only when data is needed

Data comes in through a container named by the map's `containers` glob, outside the library
levels. The component takes the data as props. A container needs no story.

## 9. Checks

Run `tests.boundary`, the story tests (`tests.stories`) and the unit suite. Report each
result as run. If one cannot run, say which and why; never report a pass that did not
happen.

## Closing note to the developer

Say what is `experimental` and who must approve it to make it `stable`. Mention any
near-duplicate found in step 1 that was left alone.
