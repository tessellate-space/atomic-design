# The doc card

Every library component documents itself in its story file, as a parameter on the meta:

```ts
const meta = {
  title: "Molecules/StatusFilter",
  component: StatusFilter,
  parameters: {
    atomic: {
      status: "experimental",
      owner: "Web team",
      design: "https://www.figma.com/design/...",
      flow: "Narrows the orders list by status; sits above the list on the orders page.",
      dos: ["Pair it with a visible count of results"],
      donts: ["Do not fetch inside it; the container passes the options"],
      combinesWith: ["OrderList", "Pagination"],
    },
  },
} satisfies Meta<typeof StatusFilter>;
```

The setup's docs page renders it above the props table and the live stories, so the
card and the examples sit on one page. It must be an inline object literal in the file,
because the checker reads the text.

## Fields

| Field | Required by the suite | Meaning |
|---|---|---|
| `status` | yes | `experimental`, `stable` or `deprecated` |
| `owner` | yes | the team or person to ask; defaults to the map's `team` |
| `design` | no | the design source (below); left out means not yet agreed with design |
| `derivedFrom` | no | code-first: the existing screen the component was extracted from |
| `flow` | no | what it is, and where it sits in the user flow |
| `dos`, `donts` | no | short rules for using it |
| `combinesWith` | no | components it is used with; the pattern search reads this |
| `approvedBy`, `approvedOn` | no | set together when the reviewer approves it for `stable` |
| `replacedBy` | no | on a `deprecated` card, the replacement (`component-lifecycle`) |

## Status

- `experimental`: new, or not yet approved. Usable; may change.
- `stable`: `design.reviewer` approved it. `approvedBy` and `approvedOn` record who and
  when. Only the developer's word that the reviewer approved it moves a card here.
- `deprecated`: do not use in new code; `replacedBy` names the replacement.

Status is an agreement between design and development, not a quality grade.

## Design source by mode

- `figma`: the frame's URL.
- `styleguide`: the styleguide entry.
- `code-first`: `"storybook"`; these stories are the reference. Add `derivedFrom` when the
  component was extracted from an existing screen.

## Enforcement

The `doc-card` rule fails the suite for a component without a card, a `status` or an
`owner` (details `no doc card`, `missing status`, `missing owner`). Components that had no
card when the rule arrived are in the baseline and leave it as cards are written. Set the
rule to `warn` in the map to list gaps without failing. Every other field is advice.
