<!-- atomic-design:begin -->
## Atomic design rules

Source of truth: `{{map_path}}` (level map, data modules, rule severities).
Levels, lowest first: atoms, molecules, organisms, templates; then containers and pages.

- `atomic-components`: library components sit in the folders the map names; a library file never imports a container or a page; each level imports its own level and below.
- `data-in-containers`: a library file imports no module listed in `dataModules`. Only containers (`{{containers_glob}}`) and pages fetch; the library takes props and emits callbacks. Existing violations are listed in `{{baseline_path}}`; the list only shrinks, so remove an entry when you fix it and never add one.
- `stories-for-every-state`: every library component has a `*.stories.tsx` beside it, one story per state (default, empty, loading, disabled, error, long content), each rendering in every locale ({{locales_list}}) and theme ({{themes_list}}).
- `tokens-only`: colours and type come from the stylesheet tokens, never literals.
- `i18n-no-hardcoded-strings`: user-facing text goes through `t()` or props.
- `doc-card`: every library component has `parameters.atomic` in its stories with at least `status` (`experimental`, `stable`, `deprecated`) and `owner`; also `design`, `flow`, `dos`, `donts`, `combinesWith`. A new component is `experimental` until the design reviewer in the map approves it.

Before adding a component: look for an existing one (by name and by props), state its props, events and who owns the state, then write it with its stories and card. Reuse or extend before creating.

Judgment calls (`pattern-before-component`, `structural-names`, `single-responsibility`, `component-lifecycle`) are advice, never a failing build.

<!-- atomic:if docs_outside_package -->
Run the commands below from `{{package_dir}}`; `{{baseline_path}}` and the other repo paths here are relative to it.
<!-- atomic:end -->
Checks: `{{boundary_command}}` (boundaries, severities and baseline), `{{stories_command}}` (story tests, mode `{{tests_mode}}`), `{{unit_command}}` (the unit suite).
<!-- atomic-design:end -->
