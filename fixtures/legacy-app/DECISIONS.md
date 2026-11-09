# Workshop decisions (for reuse)

What a workshop decides for `legacy-app`, to paste into `docs/atomic-inventory.md` when
testing `/atomic-design:migrate`. The group ids G1 to G3 follow the order the inventory
lists them in a first run; match by member names.

## First area, `src/shared/ui/mui`

| Group | Member | Decision | Structural name |
|---|---|---|---|
| badges | `StatusBadge` | keep | `StatusBadge` |
| badges | `UserStatusBadge` | merge into `StatusBadge` | |
| buttons | `AppButton` | keep | `AppButton` |
| buttons | `PrimaryButton` | merge into `AppButton` | |

Expected effect: `UserStatusBadge` and `PrimaryButton` are gone, with their call sites
adapted (`UserCard`, `OrderList`); the four `tokens-only` entries of `user-status-badge.tsx`
leave the baseline; `StatusBadge` and `AppButton` have stories and a card; the app test is
untouched.

## Second area, `src/shared/ui/composite`

The `InfoCard`, `UserCard` group (shared name `Card`) is left undecided: `migrate` must stop
and ask. Afterwards decide `keep` for both (not duplicates) and migrate `OrderList` alone to
see the container split.
