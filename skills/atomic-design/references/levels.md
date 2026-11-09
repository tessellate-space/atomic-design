# Levels and placement

Five levels, plus containers. Defaults below apply when the repo has no
`.atomic-design.json`; when it has one, its `levels`, `containers` and
`pages` globs win.

| Level | What it is | Composes | May touch data? |
|---|---|---|---|
| Atom | the smallest useful UI part: button, input, badge, icon | HTML and primitives | no |
| Molecule | a few atoms with one job: search field, labelled input | atoms | no |
| Organism | a distinct section of interface: header, order table | molecules, atoms | no |
| Template | a layout shared by two or more pages; each region is a slot | organisms, as slots | no |
| Page | a route; fills a template with real content | templates, containers | yes |
| Container | glue next to a feature: fetches, subscribes, then renders one library component | one library component | yes |

Atoms, molecules, organisms and templates are the component library. Containers
and pages are the only places that touch data.

## Atoms come from somewhere

Atoms come from the platform (HTML elements) or from the team's UI kit (a
copied-in kit such as shadcn, a themed MUI wrapper folder, a package). Do not
reinvent them. The level map can point atoms into a package.

## Templates

A template exists only for a layout two or more pages share. Each region (header,
sidebar, content) is a slot that takes organisms or any node. A layout used by
one page is just that page.

## Placement questions

Ask in this order; the first yes decides.

1. **Does it fetch, subscribe, or read server state, the router or auth?** It
   needs a container (or it is a page). The library component it renders stays
   pure: props in, callbacks out.
2. **Is it a route?** Page.
3. **Is it a layout two or more pages share, with regions as slots?** Template.
4. **Is it a distinct section of interface, made of molecules?** Organism.
5. **Does it combine a few atoms for one job?** Molecule.
6. **Otherwise** Atom (or take it from the UI kit).

The answer is one level, the number of the question that decided it, and whether
a container is needed.

## Worked placement

An order status badge fed from the API: the badge itself takes a `status` prop
and renders a coloured label, so it is an atom (question 6). The fetch sits in a
container, which reads the order and passes `status` down (question 1 decides
the container; the badge's own composition decides its level).

Distilled from a 2024 cross-disciplinary atomic design study group and production use.
