# Component lifecycle

A component moves between three statuses, recorded in its doc card (`doc-card.md`):
`experimental`, `stable`, `deprecated`. This file covers the moves and the two edits that
can break a product: changing a `stable` component and removing any component. The
flow in `component.md` and the review in `review.md` both use it. The rule id for all of
it is `component-lifecycle`.

## Statuses

- **`experimental` to `stable`.** Only when the developer says `design.reviewer` approved the
  component. Set `approvedBy` (the reviewer's role or name) and `approvedOn` (today's date)
  with the status. Never promote on your own. In `code-first` mode, the review's sign-off
  list is how the reviewer sees what to approve.
- **`stable` (or `experimental`) to `deprecated`.** Only with a named replacement: set `status: "deprecated"` and
  `replacedBy: "<Name>"` on the card. Without a replacement, ask for one; a component with
  nothing to replace it is not deprecated, it is to be removed (below). The replacement
  must exist, or be created in the same change.
- **`deprecated` back to `stable`** is a new approval; treat it as `experimental` again.

The docs page shows a banner on a `deprecated` card ("Deprecated: use `<replacedBy>`
instead"), above the card. A repo set up before the banner existed gets it by copying the
current `templates/storybook/atomic-docs-page.tsx` of `atomic-setup` over its
`.storybook/atomic-docs-page.tsx` (the file has no placeholders). Review flags every new
import of a deprecated component.

## Finding usages

Every lifecycle edit starts here. A usage is any import of the component's module
outside its own story and test files:

1. Search for the module path by every spelling the repo uses: the alias (`~/components/...`),
   relative paths, and the component's name as an identifier.
2. Follow barrel files: an `index` file that re-exports the component (`export { X } from`,
   `export * from`) makes every import of the barrel a usage; search the barrel's path too.
3. Look for dynamic imports (`import()`, `React.lazy`) and string references.
4. Add the other cards that name it in `combinesWith`, and plans that name it.

Group the result as **pages and containers**, **other library components**, **cards and
plans**. Say plainly when a usage could not be resolved (a computed path, a dynamic
specifier) and was left out of the count.

## Changing a `stable` component

Before editing, list the usages and ask whether the change is breaking. Stop and wait.

- Say what changes: the prop or event, the visual difference, the states.
- A change is breaking when a usage must change to keep working: a renamed or removed prop,
  a changed event payload, a different required prop, a visible difference the reviewer has
  not seen.
- When it is breaking, offer three ways: **a new variant** (only below
  `review.maxVariantProps`, `single-responsibility`), **a new component** with the old one
  deprecated, or **updating every usage in the same change**. Do the one the developer
  picks; nothing is edited before the answer.
- A non-breaking change still moves the card: keep `stable` only if the reviewer is told. Add
  the changed stories to the sign-off list.

An `experimental` component may change without this; still list the usages when there are
many.

## Deprecating

1. Confirm the replacement exists.
2. Edit the card: `status: "deprecated"`, `replacedBy`. Keep the other fields.
3. List the usages, group them as above, and offer to migrate them to the replacement, as
   one task per area. Do not migrate without being asked.
4. Add the deprecated component to nothing new: the review flags any added import.

## Removing

Allowed only when no usage remains.

- **No usages:** delete the component, its story file and its test, remove its
  baseline entries, and remove its name from other cards' `combinesWith`. Run the boundary and story
  tests.
- **Usages remain:** delete nothing. List them as above and offer to migrate them first
  (to the card's `replacedBy` when it has one, otherwise ask for the target). Remove only after
  the migration leaves no usage.

A review of a diff that deletes a component whose usages remain reports each remaining usage
as a `component-lifecycle` finding, with the fix "migrate it first or restore the component".
