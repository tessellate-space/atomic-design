# Step 0: facts and the level map

Read the repo and fill this table before writing anything. Every later step reads
only the level map and the facts file you build here. Put the values in a
`facts.json` in a scratch folder (not in the repo); `scripts/render_templates.py`
fills the templates from it and refuses to write a file that still has a
placeholder.

## Where to look

| Fact | Where to look |
|---|---|
| Components root | `src/` or `app/`; where components live |
| Source folder for generated tests and the checker | the components root and its `lib/` folder |
| Path alias | `vite.config.ts` `resolve.alias`, `tsconfig.json` `paths`, `components.json` |
| UI kit and atoms | `components.json` `aliases.ui` (shadcn); a themed MUI wrapper folder; a package |
| Data modules | `package.json`, `lib/`: the server-state library, the router, the API client, realtime and auth clients |
| Locales and default locale | the i18n catalogs and the i18n init module; with no i18n, the level map's `locales` (or `["en"]`). The list is never empty: `{{locales_json}}` is the map's `locales`, at least `[default_locale]` |
| Themes and how dark mode switches | a class on `<html>`, a data attribute, a theme provider |
| Unit runner and version | `package.json` (Vitest 3 or 4, Jest), its config, its `include`/`testMatch` |
| Stylesheet with tokens and fonts | the entry CSS |
| Storybook | version, builder (`@storybook/react-vite` or webpack/Next), `.storybook/main.*`, `preview.*`, story glob |
| Existing level folders | `components/ui`, `molecules`, `organisms`, `templates`, feature-sliced `shared/ui`, `features/*/ui` |
| ESLint | `eslint.config.*` (flat) or `.eslintrc*` (legacy) |
| `AGENTS.md`, `CLAUDE.md`, a rules doc | repo root, `docs/` |
| Package manager | lockfile name |

If the builder is not Vite, say so now: the Storybook builder wiring and the dev-config
test are skipped and everything else still applies (`existing-repo.md`).

## The level map

Propose `.atomic-design.json` from the facts, reusing the folders the team already
has. Show the whole map and the questions in `design-mode.md`, then write it only after
the developer confirms. Nothing is moved. Validate it:

```
python3 ${CLAUDE_SKILL_DIR}/../../scripts/check_plugin.py --validate-map .atomic-design.json
```

If that path does not exist (a vendored copy without the script), check the file
against `schema/atomic-design.schema.json` by hand. The map is the only thing later
steps and later commands read.

`dataModules` are import specifiers as written in source (`@tanstack/react-query`,
`~/lib/api`, `@/shared/api/*`). If the code also imports a data module by relative path,
list that form too.

## Facts file for the templates

Strings and lists fill `{{name}}`. Booleans switch `// atomic:if name` blocks.

| Placeholder | Meaning | Example (a Vite app with root `src`, alias `~`) |
|---|---|---|
| `{{map_path}}` | the level map's path relative to the directory of the file being written; set it before each `AGENTS.md` or `CLAUDE.md` render (see below) | `.atomic-design.json`, or `frontend/.atomic-design.json` from a root `AGENTS.md` |
| `{{components_root}}` | folder under which stories live | `src` |
| `{{alias}}` | the app's absolute alias | `~` |
| `{{alias_target}}` | the alias target, relative to the repo root | `src` |
| `{{i18n_module}}` | import specifier of the app's i18n instance | `~/lib/i18n` |
| `{{styles_import}}` | import specifier of the token stylesheet, as seen from `.storybook/` | `../src/styles.css` |
| `{{locales_json}}` | locales as a JSON array, at least the default | `["en","de"]` |
| `{{themes_json}}` | themes as a JSON array; `["light"]` when there is one theme | `["light","dark"]` |
| `{{default_locale}}` | source locale | `en` |
| `{{default_theme}}` | first theme | `light` |
| `{{dark_class}}` | class toggled on `<html>` for the dark theme | `dark` |
| `{{plugin_imports}}` | import lines for the Vite plugins `.storybook/main` may need to add | `import react from "@vitejs/plugin-react";` |
| `{{guarded_plugins}}` | one guarded line per plugin (see `02-main.md`) | `...(has("vite:react-babel") ? [] : [react()]),` |
| `{{guarded_plugins_json}}` | plugin names the dev-config test counts, as JSON | `["vite:react-babel","vite:react-refresh"]` |
| `{{vite_config}}` | the Vite config file name | `vite.config.ts` |
| `{{storybook_main_import}}` | import of `.storybook/main` from the dev-config test | `../.storybook/main` |
| `{{storybook_dir_rel}}` | `.storybook` folder relative to the Vitest config | `./.storybook` |
| `{{preview_import}}` | import of `.storybook/preview` from the harness (default export) | `../../.storybook/preview` |
| `{{stories_glob_rel}}` | story glob for `import.meta.glob`, relative to `stories.test.tsx` | `./**/*.stories.tsx` |
| `{{lib_import}}` | import of the checker's folder from `library-complete.test.ts` | `./lib` |
| `{{root_from_tests}}` | path from the dev-config test to the repo root | `..` |
| `{{a11y_test}}` | `error`, `todo` (warn) or `off`, from `rules.a11y` | `todo` |
| `{{empty_suite}}` | portable empty-suite guard: `todo` (an `it.todo`) or `pass` (a passing test), `pass` when the repo's reporter fails on todo or skipped tests (portable mode only) (`test-modes.md`) | `todo` |
| `{{containers_glob}}` | container glob from the map | `**/*-container.tsx` |
| `{{baseline_path}}` | baseline path from the map | `.atomic-design-baseline.json` |
| `{{locales_list}}` | locales, comma separated | `en, de` |
| `{{themes_list}}` | themes, comma separated | `light, dark` |
| `{{boundary_command}}` | `tests.boundary` from the map | `npx vitest run --project=unit library-complete` |
| `{{stories_command}}` | `tests.stories` from the map | `npx vitest run --project=storybook` |
| `{{unit_command}}` | `tests.unit` from the map | `npx vitest run` |
| `{{tests_mode}}` | `tests.mode` from the map | `portable` |
| `{{install_command}}` | clean install for CI | `npm ci` |
| `{{theme_import}}` | foundations, `theme-object` only: import specifier of the theme module, as seen from the story | `~/shared/theme/theme` |
| `{{theme_export}}` | foundations, `theme-object` only: the exported theme name (`tokens.export`) | `theme` |
| `{{token_source}}` | foundations: `tokens.source` from the map | `tailwind` |
| `{{token_path}}` | foundations: `tokens.path` from the map | `src/styles.css` |
| `{{grid}}` | foundations: `tokens.grid`, 4 or 8 | `4` |
| `{{reviewer}}` | foundations: `design.reviewer` from the map, or `designer` | `tech lead` |
| `{{design_mode}}` | foundations: `design.mode` from the map | `code-first` |
| `{{delta_e}}` | foundations: clustering distance for the token proposal | `3` |
| `{{playwright_version}}` | visual: the Playwright version in the lockfile; it pins the Docker image | `1.64.1` |
| `{{lockfile}}` | visual: the lockfile name | `package-lock.json` |
| `{{visual_combos_json}}` | visual: the matrix cells, `[locale, theme]` pairs (`visual.md`) | `[["en","light"],["en","dark"],["de","light"]]` |
| `{{visual_viewports_json}}` | visual: viewport names with sizes | `{"desktop":{"width":1280,"height":800}}` |
| `{{visual_vitest_command}}` | visual, `vitest-addon`: the command for the `visual` Vitest project | `npx vitest run --project=visual` |
| `{{storybook_build_command}}` | visual, Playwright path: builds the static Storybook | `npx storybook build -o storybook-static --quiet` |
| `{{chromatic_token_ref}}` | visual, Chromatic: the CI expression that reads the `CHROMATIC_PROJECT_TOKEN` secret | (the CI system's secret syntax) |

`{{map_path}}` is the only fact that differs per output file. The renderer reads one facts
file, so write the facts file once per target: the map's location relative to the directory of
the `AGENTS.md` (or `CLAUDE.md`) being rendered. A map at the repo root, with the docs there too,
gives `.atomic-design.json`; a map in a package (`frontend/.atomic-design.json`) with the docs
at the repo root gives `frontend/.atomic-design.json`; a package-level `AGENTS.md` next to the
map gives `.atomic-design.json`. `AGENTS.md` and `CLAUDE.md` in different folders get different
values. The checker, the ESLint config and the tests find the map where they are written, so
they do not use this fact.

When the `AGENTS.md` is written outside the package that holds the map (a monorepo root), set the
flag `docs_outside_package` and the fact `{{package_dir}}` (the package's path from that `AGENTS.md`,
for example `frontend`); the rules block then tells the reader to run its commands from there. Leave
both unset when the docs sit beside the map. (Only `AGENTS.md` uses them; `CLAUDE.md` is a pointer.)

Also `test_runner`: `vitest` or `jest`. It decides whether the test templates import `describe`, `it` and
`expect` from `vitest` or rely on Jest's globals.

Flags: `i18n` (the app uses i18next), `no_i18n` (the opposite; set both), `themes`
(more than one theme), `styles` (a token stylesheet exists), `vitest_addon` (mode is
`vitest-addon`).
`empty_suite_todo` and `empty_suite_pass` (exactly one is true; they match `{{empty_suite}}`).
Visual only: `playwright_spec` (modes other than `vitest-addon`, or the Playwright fallback) and
`lfs` (baselines go to Git LFS).

Check: every placeholder you need has a value, and rendering reports none left.
