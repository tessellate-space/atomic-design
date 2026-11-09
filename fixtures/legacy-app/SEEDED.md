# Seeded faults

Each fault below was planted on purpose so later changes can assert against it.
Add to this list when a fixture changes; do not edit the app silently.

| # | Fault | File |
|---|---|---|
| 1 | Library-level component fetches data through the API client (`useEffect` + `getJson`) | `src/features/orders/ui/order-list.tsx` |
| 2 | Library-level component fetches data through TanStack Query (`useQuery`) | `src/features/users/ui/user-card.tsx` |
| 3 | Near-duplicate badges, badge 1 of 2 | `src/shared/ui/mui/status-badge.tsx` |
| 4 | Near-duplicate badges, badge 2 of 2 | `src/features/users/ui/user-status-badge.tsx` |
| 5 | Two button wrappers over MUI `Button`, wrapper 1 of 2 | `src/shared/ui/mui/app-button.tsx` |
| 6 | Two button wrappers over MUI `Button`, wrapper 2 of 2 | `src/shared/ui/mui/primary-button.tsx` |
| 7 | Variant-heavy card (nine presentational props) | `src/shared/ui/composite/info-card.tsx` |
| 8 | Scattered grey literals (`#888888`, `#999999`, `#cccccc`, `#f5f5f5`) | `src/shared/ui/composite/info-card.tsx`, `src/features/orders/ui/order-list.tsx`, `src/features/users/ui/user-card.tsx`, `src/pages/dashboard.tsx`, `src/shared/theme/theme.ts` |
| 9 | Colour literals in a component instead of tokens | `src/shared/ui/mui/status-badge.tsx`, `src/features/users/ui/user-status-badge.tsx` |
| 10 | No stories anywhere (no Storybook, no `*.stories.*` file) | the whole app |
| 11 | No `containers`: nothing matches `**/*-container.tsx` | the whole app |

The level map for this app is `.atomic-design.json` (design mode `code-first`).
