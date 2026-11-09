# Planning UI work

`/atomic-design:plan` edits only the plan file the developer names (markdown). It changes
no source file and runs no test.

## 1. Read the plan and the library

Find the UI work in the plan. Run the pattern questions of `component.md` once for the
whole plan, so reuse is decided before tasks exist.

## 2. Add the Component levels table

Add a `## Component levels` section, or update it on a rerun, with one row per component
the plan needs, new or reused:

| Column | Holds |
|---|---|
| component | its name |
| level | atom, molecule, organism or template; or "stays in `<feature>`" with the reason |
| props in | the contract, with types |
| events out | `onX(payload)` |
| controlled | controlled, uncontrolled, or controlled with a default |
| container | the container that supplies its data, or "none" |
| reuses | the existing components it composes or extends, or "none" |
| design source | the Figma frame, styleguide entry, or "storybook" in code-first mode; "none yet" |
| status | `experimental` for new components, the current status for reused ones |

## 3. Rewrite the UI tasks

One task per component the plan builds or changes, with the names from the table. A
reused component that stays unchanged and already has stories and a card gets a table row
and no task; one that lacks stories or a card gets a task for them. Each task lists the stories' states,
the doc card (status, owner, design source), the copy keys for every locale, and "boundary
and story tests pass". Order the tasks:

1. **Interfaces, top-down:** templates and organisms first, each task writing only the
   contract (props, events, state ownership) and stubs.
2. **Build, bottom-up:** atoms first, then molecules, then organisms and templates, each with
   its stories and card.
3. **Containers and wiring last.**

Tasks that are not UI work stay where they are. Say in the answer what was changed.
