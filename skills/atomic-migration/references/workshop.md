# The inventory workshop

A 60 to 90 minute session with design and development together, spent on decisions: the
collecting was done by `/atomic-design:inventory`. The agent prepares and records; it does not
run the session and does not decide. The output is the edited `docs/atomic-inventory.md`,
committed.

## Before

Run the inventory, commit it, and send `docs/atomic-inventory.md` to the group. Bring the
screenshots on a screen, or the routes to click through when they are links. Bring the
glossary (`glossary.md`) and the `design.reviewer` from the map; their word makes a decision
final.

## Agenda

| Time | What |
|---|---|
| 10 minutes | The goal and the vocabulary: atom, molecule, organism, template, page, container; name by what it is, not where it appears. Read the glossary aloud. |
| 40 to 60 minutes | Decide the duplicate groups, largest total usage first. For each, ask the four questions below, then fill the Decision and Structural name cells. |
| 10 minutes | Pick the first area: the one with the fewest usages and the most duplicates. Write the order of the rest in the Areas table. |

## The four questions, for each group

1. Does this pattern already exist (in the group, or elsewhere in the kit)?
2. Does it have distinct variants, or are the differences accidents?
3. Is it used consistently?
4. Does anything else serve a similar purpose?

## Deciding

- **Decision**, one per member: `keep`, `merge into <Name>`, `drop`, `rename`. In a merge
  group exactly one member is `keep`: the survivor, and its API wins. People may overrule the
  suggested decision.
- **Structural name**, for the survivor: what the part is, by its structure, not where it
  first appeared. `UserStatusBadge` and `StatusBadge` become `StatusBadge`; `OrderListPage
  Header` becomes `PageHeader`. A good name still makes sense on another screen.
- A shared-name group that is not a duplicate: decide every member `keep`, and say so in
  the margin. It then stops blocking its areas.
- Rows can be added by hand for duplicates the scan missed; rerunning the inventory keeps them.
- Leave a group undecided when the room cannot agree. `migrate` will not touch its areas.

## After

Commit the edited inventory. The first area goes to `/atomic-design:migrate <area>`; the rest
follow the order in the Areas table, one PR each.
