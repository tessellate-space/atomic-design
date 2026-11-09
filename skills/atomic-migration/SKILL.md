---
name: atomic-migration
description: Take an existing React product to atomic design - an automated interface inventory of every component (docs/atomic-inventory.md), a workshop guide for design and dev to decide duplicates and structural names, and area-by-area migrations that move, merge and split components without changing behaviour and shrink the debt baseline. Use for "inventory our components", "interface inventory", "find duplicate components", "prepare the atomic design workshop", "migrate this area or component to atomic design", "split this component into a container", or "how far along is the migration". Needs a repo set up with /atomic-design:setup (has .atomic-design.json).
---

# Atomic migration

Most teams come to atomic design with a product already built. The method for that is the
interface inventory: gather every pattern in one place, ask the hard questions, name each
pattern by its structure. The agent does the collecting, so the workshop is spent deciding.
Migration then goes one area at a time, never changes behaviour, and shows its progress.

Two commands: `/atomic-design:inventory` and `/atomic-design:migrate <area or component>`.
The levels, rule ids and words come from the `atomic-design` skill; the card and the
removal rule from its `doc-card.md` and `lifecycle.md`; the baseline from the
`atomic-setup` skill's `ratchet.md`.

## Start here

1. Read `.atomic-design.json`. Without one, say so and suggest `/atomic-design:setup`; the
   baseline and the boundary test must exist before anything is moved.
2. Inventory (read-only apart from `docs/atomic-inventory.md` and its screenshots):
   `references/inventory.md`, filling `templates/atomic-inventory.md`.
3. People decide: `references/workshop.md` is the agenda. The agent prepares it and records
   the result; it never fills the decision or structural-name columns.
4. Migrate one area or one component per run, one PR each: `references/migrate.md`.

## Behaviour to hold

- Decisions belong to people. Suggest with a reason; leave the decision and name columns
  empty; refuse to migrate over an empty one.
- Behaviour does not change. A behaviour test may change only in its import lines.
- One area per run, one PR. Ask to split an area of more than 15 components.
- Never delete a component while usages remain (`lifecycle.md`).
- Say plainly what could not be done: no Chrome, no Storybook, an unresolved import.

## References

| File | Read it for |
|---|---|
| `references/inventory.md` | what counts as a component, usage counts, duplicate groups, screenshots, the columns |
| `references/workshop.md` | the 60 to 90 minute agenda, the questions, naming by structure |
| `references/migrate.md` | the order inside an area, the container split, test safety, progress |
| `templates/atomic-inventory.md` | the shape of `docs/atomic-inventory.md` |
