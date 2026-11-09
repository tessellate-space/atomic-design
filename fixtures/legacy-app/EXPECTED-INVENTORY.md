# Expected inventory

What `/atomic-design:inventory` must produce for this app, from `SEEDED.md`. Assert against
the list, not the wording.

## Must appear

Duplicate groups (the member names; the group id and its title may differ):

| Group | Members | Seeded as |
|---|---|---|
| badges | `StatusBadge`, `UserStatusBadge` | 3, 4 |
| buttons | `AppButton`, `PrimaryButton` | 5, 6 |

Components marked as fetching, each with `Fetches: yes`:

| Component | Path | Seeded as |
|---|---|---|
| `OrderList` | `src/features/orders/ui/order-list.tsx` | 1 |
| `UserCard` | `src/features/users/ui/user-card.tsx` | 2 |

Every other component has `Fetches: no`: `InfoCard`, `StatusBadge`, `UserStatusBadge`,
`AppButton`, `PrimaryButton`. All seven are listed with a path and a usage count, and no
component has stories or a card (seeded 10). `InfoCard` is noted as variant-heavy (nine
presentational props, seeded 7). `Dashboard` is listed under Pages, not as a component.

## May appear

- A group `InfoCard`, `UserCard` from the name stem `Card`. The props differ, so the
  suggestion should say "shared name only"; the workshop decides `keep` for both.

## Must hold

- Every group has a suggested decision with a reason, and empty Decision and Structural name
  cells.
- No screenshots: the app has no stories, so each Screenshot cell links the file and the
  routes, and Notes states the skip.
- The progress header shows 0 migrated, the baseline count at setup (the entries in
  `.atomic-design-baseline.json`), and no areas done.
- No file other than `docs/atomic-inventory.md` changes.
