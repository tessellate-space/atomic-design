# Review cases

Seeded patches for `/atomic-design:review`. Findings are compared by file and rule id, never
by wording. A missed seeded finding blocks the release.

## The base they apply to

Each patch applies, alone, to `fixtures/sample-app` in this state:

1. `atomic-design:setup` has run (Vitest addon mode, map as in the component change's run:
   locales `en` and `de`, themes `light` and `dark`, `team: "Web team"`, `design.mode`
   `figma`, `design.reviewer` `designer`, no `tokens` block, so the grid defaults to 4).
2. The change-4 run has added `Molecules/FilterBar` (stories and card; four boolean
   props: `disabled`, `compact`, `pill`, `stacked`) and the orders container uses it.
3. The checker is the current template (type-only imports are not data imports), and the
   baseline has no `data-in-containers` entry: `OrderList` imports only the `Order` type.
   The baseline holds four entries: `doc-card` and `stories-for-every-state` for
   `src/components/ui/button.tsx` and `src/features/orders/ui/order-list.tsx`.

Apply one patch per fresh copy: `git apply violations.patch` (the patches share new files such
as `src/features/orders/query-keys.ts`, so they do not stack). Leave the result uncommitted;
the review reads the working diff.

Used with `design.reviewer` `designer`, no `storybook.url` and no `review.chromatic`, so
sign-off links use `http://localhost:6006`.

## violations.patch

One entry per hunk. "Suite" means the test suite already fails or warns on it and the review
must not list its own finding.

| # | Hunk (files) | Expected | Rule id |
|---|---|---|---|
| 1 | `src/components/ui/labelled-input.tsx` (+ stories): a label and an input, in the atoms folder | finding: it is a molecule (placement question 5) | `atomic-components` |
| 2 | `src/components/molecules/recent-orders.tsx`: a molecule imports `OrderList`, an organism in `features/*/ui`, which ESLint does not cover. Also has `import type { Order }`, which is not a data import | finding at the `OrderList` import: upward import | `atomic-components` |
| 3 | `src/components/molecules/pager.tsx`: a `disabled` prop, first and last page, one story only | finding: no story for the disabled, first-page or last-page state | `stories-for-every-state` |
| 4 | `src/components/molecules/filter-empty.tsx`: "No orders match this filter." and "Clear filter" typed in JSX | no finding since 0.1.1 (the checker flags them); listed under **Tests that fail** as `i18n-no-hardcoded-strings` for both literals | `i18n-no-hardcoded-strings` (suite) |
| 5 | `src/components/molecules/section-heading.tsx`: `mt-[13px] mb-[22px] gap-[7px]` | finding at the class list: off the 4px grid | `tokens-only` |
| 6 | `src/components/molecules/filter-bar.tsx`: a fifth boolean prop, `inline` | finding: five variant props against a maximum of four; propose a separate component | `single-responsibility` |
| 7 | `src/components/molecules/status-picker.tsx`: label, options, value, onChange over buttons, the same shape as `FilterBar` | finding: near-duplicate of `FilterBar`; reuse or extend it | `pattern-before-component` |
| 8 | `src/features/orders/recent-orders-container.tsx`: a container wrapping its one component in a `section` with a heading | finding at the wrapper markup | `single-responsibility` |
| 9 | `src/features/orders/order-archive-container.tsx`: `queryKey: ["orders", "archive"]` inline, while `query-keys.ts` exists | finding at the key | `single-responsibility` |
| 10 | `src/components/molecules/result-count.stories.tsx`: `stable` with no `design`, `combinesWith: ["OrderTable"]`, which does not exist | finding on both defects | `doc-card` |
| 11 | `.atomic-design-baseline.json`: two new entries for `src/components/molecules/legacy-banner.tsx` | finding on the baseline: it grew; fix the code instead | `doc-card`, `stories-for-every-state` |
| 12 | `src/components/molecules/refresh-button.tsx`: imports `fetchOrders` from `~/lib/api` | no finding; listed under **Tests that fail** as "boundary test fails" | `data-in-containers` (suite) |
| 13 | `src/components/molecules/plain-note.tsx` (+ stories with no `parameters.atomic`) | no finding; under **Tests that fail** (`doc-card` at `error`) or, with `rules.doc-card` set to `warn`, under **Warned by the suite** | `doc-card` (suite) |

Support files with no finding: `src/features/orders/query-keys.ts` (the key factory) and
both locale files (keys for the new components). Hunk 11's `legacy-banner.tsx` is baselined
debt: the review points to the baseline, not to its missing story or card.

Not expected: a finding for the type-only import in hunk 2, for the existing
`orders-container.tsx` (not in the diff), or for any suite rule at `error`.

Sign-off list (all runs): the stories of every added or changed story file, with the card
status and design link, headed "For sign-off by designer". Hunk 13 shows "design: not yet
agreed with design" (no card); hunk 10 shows `stable` and no design.

Suite state on this patch (checked by running it): the unit suite fails only on hunks 4, 12 and
13 (`i18n-no-hardcoded-strings: filter-empty.tsx` twice, `data-in-containers: refresh-button.tsx ~/lib/api`,
`doc-card: plain-note.tsx no doc card`);
the story tests pass.

Tolerated extras (seen in runs, not seeded, not blocking): borderline level-fit or
near-duplicate notes on the other tiny new files (`plain-note`, `legacy-banner`,
`filter-empty`), and extra missing-story suggestions on new components. Blocking: a missing
expected finding (hunk 4 is not one), a finding for a suite rule at `error`, or a finding for the type-only import.

## lifecycle.patch

The patch deprecates `FilterBar` in favour of a new `FilterSelect`, adds a page that imports
`FilterBar`, and deletes `OrderList` while the orders container still imports it.

| # | Hunk (files) | Expected | Rule id |
|---|---|---|---|
| L1 | `src/pages/invoices-page.tsx`: a new import of `FilterBar`, whose card is now `deprecated` with `replacedBy: "FilterSelect"` | finding at the import, naming `FilterSelect` | `component-lifecycle` |
| L2 | `src/features/orders/ui/order-list.tsx` deleted; `src/features/orders/orders-container.tsx` still imports `./ui/order-list` | the removal is refused: finding at the container's import, listing it as a remaining usage; fix: migrate first or restore | `component-lifecycle` |
| L3 | `src/components/molecules/filter-bar.stories.tsx`: `combinesWith` still names `OrderList`, now removed | finding on the stale card | `doc-card` |

Not expected: a finding for the existing `FilterBar` import in `orders-container.tsx`
(not a new import), or any suite rule (the suite is green on this patch).

Tolerated extras: notes on the existing `FilterBar` usage in `orders-container.tsx` and on the
plan file (not new imports), and on the narrower `FilterSelect` contract.

Sign-off list: the `FilterBar` stories (`deprecated`, replaced by `FilterSelect`) and the
four `FilterSelect` stories (`experimental`, with its design link).

## clean.patch

A correct molecule `OrderCount` (props in, callback out, `t()` copy in both locales, spacing on
the grid, stories for default, zero, refreshing and longest copy, a full card with a design
link), its container (one library component, no markup, keys from the factory) and the key
factory.

Expected: `No findings.`, nothing under **Tests that fail** or **Warned by the suite**, and the
sign-off list with the four `OrderCount` stories (`experimental`, design link set).
The unit and story suites pass on this patch.
