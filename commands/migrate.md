---
description: Migrate one area or one component to atomic design from the decided inventory - move, merge, split containers, add stories and cards, shrink the baseline, behaviour unchanged.
argument-hint: "<area from the inventory | component name>"
---

Use the `atomic-migration` skill and follow its `references/migrate.md` for this target:
$ARGUMENTS

Read `.atomic-design.json` and `docs/atomic-inventory.md` first. If the target has a
duplicate group with no decision, stop and ask for it. One area or one component per run, one
PR. Behaviour tests may change only their import lines. Report the suite results as run, and
update the inventory's progress header.
