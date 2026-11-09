# Design mode

Ask one question in the setup batch:

> Do you work from Figma, from a written styleguide, or code first, with Storybook as the
> reference?

Map the answer to `design.mode`: `figma`, `styleguide` or `code-first`. In `figma` and
`styleguide` modes the reviewer defaults to `designer` (write `design.reviewer` only if
the team names someone else). In `code-first` mode, ask who approves components and
visual changes, and record it in `design.reviewer`. `code-first` without a reviewer is a
schema error, so do not write the map without one.

The Foundations, component and review commands (later changes) read these fields.

If the map already has `design`, do not ask again.

## The other setup questions

Ask these in the same batch, with their defaults:

1. Story-test mode: shown only when there is a real choice (`test-modes.md`).
2. Vitest 4 upgrade: only on Vite with Vitest 3 (`vitest-upgrade.md`). Default: no.
3. Storybook MCP: only on Vite with Storybook 10.3+. Default: no.
4. Opt-in hook: "Run the boundary test after every edit under a library folder?" Default:
   no. Write `hook.enabled`.
5. `eslint-plugin-boundaries`: only when the repo has ESLint. Default: no.
6. Design mode and reviewer (above).
7. Team name: "Which team owns this library?" Write it as `team`; the component flow
   proposes it as a new component's owner. Optional; skip it if the answer is none.
