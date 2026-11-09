---
name: atomic-design
description: Atomic design for React UIs. Use when placing, naming, splitting, reviewing or planning a component; when asked about atoms, molecules, organisms, templates, pages, containers, a component library, a design system, presentational versus container components, where data fetching belongs, or how design and development should share vocabulary. Also use whenever asked to build, add or change UI (a component, a filter bar, a form, a card, a screen) in a repo that has .atomic-design.json, or to plan UI work. Applies to new and existing React products. Reads .atomic-design.json when the repo has one.
---

# Atomic design

A mental model with boundaries, not a recipe. Use it to decide where a React
component belongs, how it is shaped, and what it may touch. The hard rule is
about data; everything else is judgment that never fails a build.

## When to use this skill

- Someone asks where a component, hook or fetch belongs.
- Someone asks what an atom, molecule, organism, template or page is.
- A component is being added, split, merged or reviewed.
- A design system or component library is being planned or audited.
- UI is being built, added or changed in a repo with `.atomic-design.json`: follow
  `references/component.md` without being asked. A UI plan: `references/plan.md`.
- UI code, a branch or a pull request is being reviewed: follow `references/review.md`.
- A component is being changed (when `stable`), deprecated or removed: follow
  `references/lifecycle.md` first.

Answer from the references below. Do not wait to be asked for "atomic design".

## Start here

1. Look for `.atomic-design.json` at the repo root, or at the path `AGENTS.md` names (a monorepo keeps it in the package). If it exists, its `levels`,
   `containers`, `pages` and `dataModules` say where things live in this repo;
   its `rules` say how strict each rule is. Its format is in
   `schema/atomic-design.schema.json`. If it does not exist, use the defaults
   in `references/levels.md` and say so.
2. Read `references/model.md` for the principles, `references/levels.md` for the
   levels and the placement questions, and `references/rules.md` for the rule
   ids. Use `references/glossary.md` for the exact words, so design and
   development read the same thing.
3. When you answer a placement question, give one level, the question that
   decided it, and whether a container is needed.
4. Cite a rule only by its id from `references/rules.md`.

## Behaviour to hold

- The data boundary is the one hard rule. Only containers and pages touch data.
- Never reject a component for its line count, or because it uses a lower
  level's neighbour directly. Raise judgment calls as advice, not as failures.
- Atoms come from the platform or the team's UI kit. Do not reinvent them.
- Templates exist only for a layout two or more pages share.

## References

| File | Read it for |
|---|---|
| `references/model.md` | the principles and how to design and build |
| `references/levels.md` | the five levels, containers, and the placement questions |
| `references/rules.md` | the rule ids, their tier, default severity and check |
| `references/component.md` | building or changing a component: pattern questions, design source, contract, stories, card |
| `references/doc-card.md` | the card fields, status meanings, and how the suite checks them |
| `references/review.md` | reviewing a diff, branch or path: the findings, the rules the suite owns, the sign-off list |
| `references/lifecycle.md` | statuses, changing a stable component, deprecating, removing, finding usages |
| `references/plan.md` | the Component levels table and task order for a UI plan |
| `references/glossary.md` | one definition per term, shared by design and dev |
