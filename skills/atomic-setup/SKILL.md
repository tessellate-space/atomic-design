---
name: atomic-setup
description: Set up the atomic design library in a React repo - write the level map (.atomic-design.json), wire Storybook (locale and theme switches), add boundary checks with a ratchet baseline, story tests in a real browser or jsdom, ESLint rules, AGENTS.md rules, optional Storybook MCP and an opt-in hook. Use for "set up atomic design", "add Storybook with atomic levels", "enforce that components don't fetch data", or when a repo has no .atomic-design.json yet. Works on new and existing repos, with or without Storybook, and is safe to rerun.
---

# Atomic setup

Gives a repo the atomic design method's guarantees **in the repo's own tests and lint**, so
they hold whether or not anyone uses this plugin. Source code is never moved or edited;
setup adds config, tests, a baseline, lint overrides and docs.

Run as `/atomic-design:setup`. Read the core skill (`atomic-design`) for the levels and the
rule ids; this skill only does the wiring.

## Ground rules

- **Probe, then act, then check.** Every step has a probe ("is this already in place?"). If
  yes, print `step N: already in place` and write nothing. A second run changes no file.
- **Ask once, before writing.** Read the repo (step 0), then ask all questions in one batch
  (`references/design-mode.md` lists them with defaults). Answers passed with the command
  count as answered. Never ask what the map already records.
- **Confirm the map before writing it.** Show it whole.
- **Do not tick a step until its check passed.** If a check cannot run, say which and why.
- **Never** upgrade or reinstall an existing Storybook, change a non-Vite builder's
  config, upgrade Vitest without a yes, or regenerate the baseline.
- Templates are filled with `scripts/render_templates.py` (see below). Never leave a
  placeholder, and never copy the worked example's paths or locales into a repo.
- Judgment never fails a build. Only the mechanical rules in the suite fail it.

## Steps

| Step | Reference | Writes |
|---|---|---|
| 0 | `references/facts.md` | the facts, the level map `.atomic-design.json` (after confirmation) |
| 1 | `references/01-install.md` | Storybook, pinned exactly (skipped when present) |
| 2 | `references/02-main.md` | `.storybook/main`, guarded plugins, alias, dev-config test (Vite) |
| 3 | `references/03-preview.md` | `.storybook/preview`: stylesheet, locale and theme switches |
| 4 | `references/04-folders.md` | level folders from the map; nothing moves |
| 5 | `references/05-boundaries.md`, `references/ratchet.md` | the checker, its tests, the boundary test, the baseline |
| 6 | `references/06-story-tests.md`, `references/test-modes.md` | story tests in one of three modes |
| 7 | `references/07-stories.md` | the story standard (documentation only) |
| 8 | `references/eslint.md` | ESLint overrides, when the repo has ESLint |
| 9 | this file, below | `AGENTS.md` rules, a pointer in `CLAUDE.md` |
| 10 | `references/storybook-mcp.md` | Storybook MCP, when offered and accepted |
| 11 | this file, below | the opt-in hook flag in the map |

Special cases: `references/existing-repo.md` (existing Storybook, non-Vite builders, rerun),
`references/vitest-upgrade.md` (a separate, confirmed step), `references/portable-hardening.md`.

## Foundations (`/atomic-design:foundations`)

The `foundations` command reuses this skill's facts and templates. Follow
`references/foundations.md`: find the tokens, draft usage guidance, propose tokens from
code in `code-first` mode (`scripts/cluster_tokens.py`, approval before any write), add the
Foundations story and baseline the existing literals for the `tokens-only` rule. The same
ground rules apply: probe first, ask once, never tick a step whose check did not pass.

## Visual snapshots (`/atomic-design:visual`)

The `visual` command reuses this skill's facts and templates. Follow
`references/visual.md`: pick the capture by test mode, write the Docker script, the
capture config and the CI job, and keep `visual.mode` in the map. The same ground rules
apply; nothing is committed, and Chromatic is configured but never signed up for.

## Rendering templates

Put the facts in a JSON file outside the repo (a scratch folder) and run:

```
python3 ${CLAUDE_SKILL_DIR}/scripts/render_templates.py FACTS.json TEMPLATE OUTPUT
python3 ${CLAUDE_SKILL_DIR}/scripts/render_templates.py FACTS.json --check TEMPLATE...
```

`{{name}}` takes a string or a list (as JSON); booleans switch `// atomic:if name` ...
`// atomic:end` blocks. A placeholder with no fact stops the render. The placeholders are
listed in `references/facts.md`. If `${CLAUDE_SKILL_DIR}` is not set, use this skill's folder.
Templates are under `templates/`:

| Template | Step | Used for |
|---|---|---|
| `templates/storybook/main.ts` | 2 | Storybook main (Vite) |
| `templates/storybook/preview.tsx` | 3 | preview with locale and theme globals |
| `templates/storybook/atomic-docs-page.tsx` | 3 | docs page that renders the doc card above the props table |
| `templates/tests/storybook-dev-config.test.ts` | 2 | dev-config test |
| `templates/lib/atomic-boundaries.ts`, `templates/lib/atomic-boundaries.test.ts` | 5 | the checker and its fixture tests |
| `templates/tests/library-complete.test.ts` | 5 | the boundary test on the real tree |
| `templates/tests/story-harness.tsx`, `stories.test.tsx`, `story-harness.test.tsx`, `story-harness-i18n.test.tsx`, `templates/tests/fixtures/*.fixture.tsx` | 6 | `portable` mode |
| `templates/vitest/storybook-project.ts` | 6 | `vitest-addon` mode, when the CLI cannot edit the config |
| `templates/test-runner/test-runner.ts` | 6 | `test-runner` mode |
| `templates/ci/vitest-addon.yml`, `test-runner.yml`, `portable.yml` | 6 | CI job per mode |
| `templates/eslint/atomic.eslint.mjs` | 8 | ESLint |
| `templates/agents/rules-block.md`, `claude-pointer.md` | 9 | `AGENTS.md`, `CLAUDE.md` |
| `templates/foundations/foundations.stories.tsx`, `foundations-theme.stories.tsx`, `foundations.md`, `foundations-proposal.md` | foundations | the Foundations story, `docs/foundations.md`, the code-first token proposal |
| `templates/visual/*`, `templates/ci/visual-local.yml`, `templates/ci/visual-chromatic.yml` | visual | the Docker script, capture config, the preview hooks, CI, LFS attributes |

## Step 9: `AGENTS.md` and `CLAUDE.md`

Render `templates/agents/rules-block.md` and insert it between its
`<!-- atomic-design:begin -->` / `<!-- atomic-design:end -->` markers in `AGENTS.md`
(create the file if it does not exist; replace the block if the markers exist; touch
nothing outside them). If `CLAUDE.md` exists, add `templates/agents/claude-pointer.md`
the same way. Set `map_path` in the facts for each of the two files (`references/facts.md`): the map's path relative to that file's folder, so a root `AGENTS.md` over `frontend/.atomic-design.json` says `frontend/.atomic-design.json`. The rule ids come from the core skill's `references/rules.md`.

**Probe:** markers present and the block equals the rendered one -> already in place.

## Step 11: the hook

The plugin ships a `PostToolUse` hook that runs `tests.boundary` after an edit under a
library level, only when the map has `hook.enabled: true`. Setup only writes that flag, from the answer
(default false). Tell the developer the plugin must stay installed for the hook; the
tests and lint do not need it.

## Finish

1. Run the whole unit suite, the story tests (`tests.stories`) and, on Vite, the
   Storybook build. Report each result.
2. Grep what you wrote for `{{` and `atomic:` leftovers and for the worked example's
   values; expect nothing.
3. Print the summary: the steps done, the steps already in place, what was skipped and
   why (non-Vite builder), the recorded test mode and its note, the baseline count, and the
   commands to run each check. Do not commit.
