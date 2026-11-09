# Interface inventory

Written by `/atomic-design:inventory` on <date>. The agent suggests; people decide. The
Decision and Structural name columns are filled in at the workshop (`workshop.md`) and read
by `/atomic-design:migrate`. Do not edit the other columns by hand; rerun the inventory.

## Progress

| | |
|---|---|
| Components migrated | 0 of <total> |
| Baseline entries | <now> now, <at-start> at the first inventory |
| Areas done | 0 of <areas> (none yet) |

## Areas

Migrate in this order: fewest usages and most duplicates first.

| Area | Components | Migrated | Duplicate groups | Status |
|---|---|---|---|---|
| <folder> | <n> | <m> | <group ids> | todo |

## Duplicate groups

### G1 <stem or shared name>

| Member | Path | Props | Usages | Screenshot | Decision | Structural name |
|---|---|---|---|---|---|---|
| <Name> | <path> | <props, with types> | <n> | <image or link> | | |

Why grouped: <shared stem, or props overlap and similar JSX root>.
Suggested decision: <keep X, merge Y into X, drop, rename>. Reason: <one sentence>.

Decision values: `keep`, `merge into <Name>`, `drop`, `rename`. Exactly one member of a
merge group is `keep`; that one is the survivor.

## Components

| Component | Path | Area | Usages | Level | Deciding question | Fetches | Stories | Card | Baseline entries | Group | Migrated |
|---|---|---|---|---|---|---|---|---|---|---|---|
| <Name> | <path> | <area> | <n> | <level> | <number and words> | yes or no | yes or no | yes or no | <n> | <G id or -> | |

## Pages

| Route file | Renders | Uses data |
|---|---|---|
| <path> | <components> | <yes or no> |

## Notes

<Screenshots: taken from <n> stories, or skipped because <reason>. Imports that could not be
resolved and were left out of the counts. Components the agent could not place.>
