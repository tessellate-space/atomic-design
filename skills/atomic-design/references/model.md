# The model

Atomic design is a mental model with boundaries, not a recipe. The patterns that
fit a product are specific to that product; the method gives you vocabulary and
a few lines that stay put.

## Principles

- **Boundaries, not hard rules.** One boundary is firm: where data enters the
  tree. Everything else (which level a component sits at, how big it is, how many
  variants it has) is a judgment call. Advise on it; do not fail a build for it.
- **A library without business logic.** Atoms, molecules and organisms form the
  component library and carry no business logic and no data access. Templates and
  pages compose that library with logic, through containers.
- **No size limits, no "never skip a level".** A molecule may be long. An
  organism may use an atom directly. Neither is a finding. Only an import of a
  data module below a container is.
- **Design top-down, build bottom-up.** Draw the interfaces of templates and
  organisms first, to learn what the product needs. Build atoms first, so the
  larger pieces stand on finished parts.
- **Single responsibility.** A component does one job. When it has to behave very
  differently across screen sizes, prefer a new component over another variant
  prop.
- **Pattern before component.** Name the recurring pattern in the product (a
  filterable list, a status summary) before drawing its component, and check
  whether the product already has one.
- **Structural names.** Name a component for what it is (`StatusBadge`), not
  for where it first appeared (`DashboardTopThing`).

## How to apply it

1. Place the thing with the questions in `levels.md`.
2. Check it against the rule ids in `rules.md`.
3. Use the words in `glossary.md` when you explain the decision.

Distilled from a 2024 cross-disciplinary atomic design study group and production use.
