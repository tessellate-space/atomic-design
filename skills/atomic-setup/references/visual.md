# Visual snapshots

`/atomic-design:visual [local | chromatic | off]` snapshots every story, so a reviewer
approves image diffs instead of opening each story. It sets `visual.mode` in the map.
Story tests prove a component works; this proves it still looks right.

| Mode | What it is |
|---|---|
| `off` (default) | nothing runs |
| `local` | baselines are committed images; one Docker script updates and compares them; CI runs the same script |
| `chromatic` | the upgrade: CI publishes to Chromatic; stories are unchanged; the project token is the team's secret |

Same ground rules as setup: probe first, ask once, never tick a step whose check did not run,
change nothing outside the files named here. Chromium only; stories only (no pages with live
data). Never create a Chromatic account, ask for its token or call its API.

## 1. Facts

Read the map (`locales`, `defaultLocale`, `themes`, `tests.mode`, `visual`), then fill the
visual rows of `facts.md`.

- **Image:** `mcr.microsoft.com/playwright:v<version>-noble`, where the version is the
  `playwright` package in the lockfile. The script pins it; image and package must be the
  same version, or the browser build differs. `vitest-addon` repos already have
  `playwright`; other modes add `@playwright/test` (`npm i -D --save-exact @playwright/test@<same version>`;
  on `test-runner` use the version the test runner already resolved).
- **Matrix** (`visual.matrix`): `default` is the default locale x every theme, plus the
  **longest locale** in the default theme. The longest locale is the one whose catalog has the
  most characters in its string values (sum the lengths of every string in each catalog file);
  say which it is and the numbers. `all` is every locale x theme. No locales or themes in the
  map: use `default` for that axis (the capture then passes no global for it).
- **Viewports** (`visual.viewports`, default `["desktop"]`): `desktop` 1280x800, `mobile` 390x844.
- Write the cells as `[locale, theme]` pairs in `visual_combos_json` and the sizes in
  `visual_viewports_json`.

## 2. Capture, by test mode

| `tests.mode` | Capture | Files |
|---|---|---|
| `vitest-addon` | Vitest 4 browser mode: `expect.element(locator).toMatchScreenshot(name)` in a third Vitest project, `visual`, that runs the stories | `.storybook/visual.ts`, `.storybook/visual.setup.ts`, the `visual` project (`templates/visual/vitest/vitest-project.ts`) |
| `test-runner` | a Playwright spec that walks the built Storybook's `index.json` and calls `toHaveScreenshot` per story | `visual/visual.spec.ts`, `visual/playwright.config.ts`, `visual/serve.mjs` |
| `portable` | the same Playwright spec | the same files |

The Vitest assertion is `expect.element(locator).toMatchScreenshot(name?, options?)`, with the
reference screenshot beside the failure's `actual` and `diff` images. The test runner's own
`postVisit` hook would need an extra image-snapshot library and cannot reach the matrix, so
`test-runner` uses the Playwright spec too, against the same `storybook build` output.
If the Vitest assertion does not fit a repo, `vitest-addon` repos may use the Playwright spec.

An empty-state story renders nothing and leaves a 0px-tall canvas that cannot be captured ("Could not capture a stable screenshot"); `visual.ts` gives the canvas `min-height: 1px` first, so the story keeps a baseline.

**Both paths write the same layout:** baselines `visual/baselines/<story-id>-<locale>-<theme>-<viewport>.png`
(runs of dashes in the story id collapsed to one), failures under `visual/results/`
(`<name>-diff.png` and `<name>-actual.png`; the Playwright path nests them in a folder per
test and adds `-expected.png`). `visual/results` is gitignored.

### `vitest-addon` wiring

1. Render `templates/visual/vitest/visual.ts` to `.storybook/visual.ts` and `visual.setup.ts`
   to `.storybook/visual.setup.ts`.
2. Add the `visual` project to the Vitest config from `templates/visual/vitest/vitest-project.ts`
   (the viewport and screenshot paths in it are part of the project). Do not change the
   `unit` or `storybook` projects.
3. Patch `.storybook/preview.*` with three small edits and nothing else: import
   `{ visualAfterEach, visualDecorator, visualGlobals }` from `./visual`; add
   `visualDecorator` to `decorators` and `afterEach: visualAfterEach`; spread `...visualGlobals`
   at the end of `initialGlobals`. All three are inert unless the run sets `VITE_VISUAL`,
   so `storybook dev` and `storybook build` are unchanged. `scripts/visual.sh` runs the
   project once per matrix cell and viewport with `VITE_VISUAL_GLOBALS=<locale>:<theme>`.

### `test-runner` and `portable` wiring

Render `templates/visual/playwright/visual.config.json` to `visual/visual.config.json`; copy
`playwright.config.ts`, `visual.spec.ts` and `serve.mjs` to `visual/`. The spec opens each
story at `iframe.html?id=<id>&globals=locale:<l>;theme:<t>`, waits until Storybook has
finished rendering and the play function and `document.fonts.ready` are done, and compares the
story root. Animations are disabled by Playwright and the viewport is fixed per project.

## 3. Determinism

- One script, `scripts/visual.sh` (render `templates/visual/visual.sh`), runs `update` and
  `compare` inside the pinned image. Dependencies install into a Linux-only Docker volume,
  so the host's `node_modules` is untouched. CI runs the same script
  (`templates/ci/visual-local.yml`). With no Docker the script says so and exits; baselines are then
  updated by the CI job, never by a different browser.
- Animations and transitions are off, fonts are awaited, the viewport is fixed, one browser.
- **Opt-out:** `parameters: { visual: false }` on a story or its meta skips it (both paths).
  List every opt-out in the report: `grep -rn "visual: false" <components root>`.
- Where Docker cannot run, say that the Docker half was not verified.

## 4. Baselines

1. Run `sh scripts/visual.sh update`. Check that the baselines exist for every story in the
   default locale x every theme, plus the longest locale.
2. Run `sh scripts/visual.sh compare` twice. Expect no diff, exit 0.
3. **Size:** `du -sk visual/baselines`. Past `visual.lfsThresholdMb` (default 20), append
   `templates/visual/gitattributes` to `.gitattributes`, set the `lfs` flag in the CI template, and tell
   the developer to run `git lfs install` once. Otherwise say they are plain Git files.
4. Add `visual/results` and `test-results` to `.gitignore`.
5. Add the CI job (`templates/ci/visual-local.yml`) and write `visual.mode: local` plus any
   non-default `visual.matrix`, `viewports` and `lfsThresholdMb` to the map. Validate the map.

## 5. Updating baselines

An intended change updates the baselines in the same pull request: `sh scripts/visual.sh update`,
then look at the changed images, then commit them. An unintended diff fails the `visual` job
and names the stories; the images are in `visual/results` (the job uploads them). The review
(`review.md`, section 5) lists the changed baselines with before and after images for
`design.reviewer`, grouped by cause when there are many. Developers without Docker add the
label the team's CI uses to run `update` and push.

## 6. `chromatic`

Probe: `visual.mode` already `chromatic` and the CI step present -> already in place.

1. Write the CI job from `templates/ci/visual-chromatic.yml` (`npx chromatic --exit-zero-on-changes`,
   the token read from the CI secret `CHROMATIC_PROJECT_TOKEN`) in place of the `visual` job.
   Tell the team to add that secret; never write, request or print a token.
2. Set `visual.mode: chromatic`. If the team gives a Chromatic build or project URL, record it
   as `review.chromatic`, so the sign-off list links the build.
3. No story file changes. Local baselines, `scripts/visual.sh` and the `visual` files stay
   until the developer confirms. Then, after that yes: delete `visual/` and
   `scripts/visual.sh`, remove the `visual` Vitest project and the three preview edits
   (`vitest-addon`), the `.storybook/visual*.ts` files, the `.gitignore` and LFS lines, and the
   `visual` CI job.
4. Chromatic also publishes a Storybook MCP endpoint (the docs tools) for each published
   Storybook, at the Storybook's `/mcp` route; see Chromatic's MCP documentation. The plugin
   does not wire it.

Dry run: nothing in this flow calls Chromatic. Check the CI file parses, reads the secret by
reference, has no literal token, and that `git status` shows no story file changed.

## 7. `off`

Set `visual.mode: off`, remove the `visual` CI job and say that `scripts/visual.sh` and the
baselines remain. Removing them is the same confirmed step as in `chromatic`.

## Checks to run, then report

- baselines exist for the matrix; a second `compare` shows no diff;
- a token change fails `compare` and names the stories (revert it after);
- the map validates (`check_plugin.py --validate-map`);
- no story file changed; a second run of this flow changes no file.
