# Existing repos: Storybook, builders, rerun

## Existing Storybook

- Keep the installed version and every existing story. Never reinstall or upgrade.
- Merge, do not replace: the guarded plugins and alias into the existing `viteFinal`, the
  decorators and globals into the existing preview, a widened story glob in `main`.
- Existing addons stay. Add test addons only as the test mode requires.
- If a story already uses the app's own providers, keep them; remove nothing.
- Check afterwards: the version is unchanged, the old stories are byte-identical, and the
  locale and theme switches work on them.

## Non-Vite builders (webpack, Next.js, others)

- Skip: the `main` changes (step 2), the dev-config test, and the alias. Say so in the
  summary ("builder is webpack5: builder wiring left alone").
- Still do: the level map, the boundary checks, the baseline, ESLint, `AGENTS.md`, the
  opt-in hook, and story tests in `test-runner` mode.
- Never edit the builder's configuration. If the preview needs locale and theme switches
  and the app has them, merge them into the preview (it is not builder config); a repo
  with no i18n and one theme needs nothing there.
- Storybook MCP is offered on Vite only (`storybook-mcp.md`).

## Rerun

Every step starts with its probe. When the probe says the step is in place, print
"step N: already in place" and write nothing. A second run on a finished repo ends with
`git status` unchanged. Things that must not be regenerated: the baseline (it only
shrinks), the map after the developer edited it, and the pinned versions.

If the map exists, read it instead of proposing a new one and treat its values as the
facts. Ask only the questions whose answers are missing from it.

## When something is wrong in the repo

Report it and stop that step; do not fix unrelated problems. A red existing suite before
setup is reported as the starting state and not hidden by the baseline.
