# Story-test modes

Choose the strongest mode the repo supports and record it in the map: `tests.mode`,
`tests.stories` (the command), and `tests.note` when the mode is not `vitest-addon`.

| Mode | Chosen when | `tests.stories` |
|---|---|---|
| `vitest-addon` | Vite builder, and Vitest 4 present or the upgrade accepted | `npx vitest run --project=storybook` |
| `test-runner` | non-Vite builder | `npm run test:stories` (build, serve, `test-storybook`) |
| `portable` | Vite with Vitest 3 or Jest and no upgrade | `<unit command> stories` |

Decision: non-Vite builder -> `test-runner`. Vite with Vitest 4 -> `vitest-addon`. Vite with
Vitest 3 -> offer the upgrade (`vitest-upgrade.md`); accepted -> `vitest-addon`, declined or
Jest -> `portable`, with `tests.upgradeDeclined: true` and a note such as "portable: Vitest 3,
upgrade declined; jsdom renders miss layout and CSS faults and cannot run play functions
in a browser or the accessibility checks".

## `vitest-addon` (default on Vite)

Every story runs as a Vitest test in headless Chromium: play functions, accessibility checks,
and Storybook MCP's story tests all work.

1. `npx storybook add @storybook/addon-vitest` and `npx storybook add @storybook/addon-a11y`.
   The first installs Playwright's Chromium, creates `vitest.shims.d.ts` and turns the Vite
   config's `test` block into two Vitest projects. Pin both addons to the Storybook
   version (the CLI writes `^`).
2. If the CLI cannot edit the config (separate `vitest.config.ts`, workspace file), apply
   `templates/vitest/storybook-project.ts` by hand.
3. Name the existing project `unit` so the two suites can run apart: add `name: "unit"` to
   its `test` options. Set `tests.unit` to `npx vitest run --project=unit` and
   `tests.stories` to `npx vitest run --project=storybook`. `tests.boundary` is
   `npx vitest run --project=unit library-complete`.
4. Zero stories must not fail the run. Set `passWithNoTests: true` in the top-level `test`
   block (next to `projects`); put in the storybook project alone it is ignored and
   `vitest run --project=storybook` exits 1 with "No test files found" on a repo that has
   no stories yet (portable mode's empty-suite guard covers the same case). Check it: with no
   story file the command exits 0.
5. Accessibility: the preview's `parameters.a11y.test` follows `rules.a11y`: `error` ->
   `"error"`, `warn` (default) -> `"todo"` (reported per story, does not fail), `off` ->
   `"off"`. Violations show under the `a11y` rule. `warn` stays available under a strict reporter
   (below): the addon's todo does not reach Vitest's reporter.
6. Add the CI job (`templates/ci/vitest-addon.yml`): the browsers must be installed
   (`npx playwright install --with-deps chromium`).

Running only changed stories locally: `npx vitest --project=storybook` in watch mode.

## `test-runner` (non-Vite builders)

`@storybook/test-runner` drives Chromium against the **built** Storybook, so the builder's
configuration stays untouched.

1. `npm i -D --save-exact @storybook/test-runner concurrently http-server wait-on` and
   `npx playwright install chromium`.
2. Copy `templates/test-runner/test-runner.ts` to `.storybook/test-runner.ts` (fails a story
   on `console.error`).
3. Add the script, using the repo's Storybook port and static output folder:

   ```json
   "test:stories": "storybook build -o storybook-static --quiet && concurrently -k -s first -n SB,TEST \"http-server storybook-static --port 6006 --silent\" \"wait-on tcp:127.0.0.1:6006 && test-storybook --url http://127.0.0.1:6006\""
   ```

   `tests.stories` is `npm run test:stories`.
4. CI: `templates/ci/test-runner.yml`; it builds once.

Add `storybook-static` to `.gitignore`.

## `portable` (fallback)

`composeStories` in the existing unit suite (jsdom), once per locale x theme. Weaker:
jsdom misses layout and CSS faults. Follow `portable-hardening.md`. Add
`templates/ci/portable.yml` only if the unit job does not already exist.

## Strict reporters

Some repos fail the run on any todo or skipped test (a custom Vitest or Jest reporter, a CI
step that greps the output). Only one thing the plugin generates reaches such a reporter as a
todo: portable mode's empty-suite guard (`it.todo("no stories yet")`). Detect the case before
choosing it.

**Detect:** read the unit runner's config (`vitest.config.*`, the Vite config's `test`
block, `jest.config.*`): its `reporters`, and any reporter file it names. Treat the repo as
strict when a reporter, or a CI script, fails on `todo`, `skipped`, `pending` or
`it.todo` (for example it counts `task.mode === "todo"` or `"skip"` and sets
`process.exitCode`). When the config shows nothing and the repo has no custom reporter,
it is not strict. When you cannot tell, ask the developer; do not guess.

**What a strict reporter changes, by mode:**

| Mode | `rules.a11y: warn` | Empty-suite guard |
|---|---|---|
| `vitest-addon` | stays available and the default; ask nothing extra | not generated (the top-level `passWithNoTests: true` covers zero stories) |
| `portable` | no effect (the jsdom harness runs no accessibility checks) | `pass`: a passing test, no `it.todo` |
| `test-runner` | no effect (the template generates no a11y todo; read, not run) | not generated |

**When strict:**

- Set the fact `{{empty_suite}}` to `pass`, with the flag `empty_suite_pass` true and
  `empty_suite_todo` false: the rendered `stories.test.tsx` then has
  `it("no stories yet", () => {})` and no `it.todo`.
- Otherwise `{{empty_suite}}` is `todo`, with `empty_suite_todo` true and `empty_suite_pass` false.
- `{{a11y_test}}` follows `rules.a11y` as usual (`warn` -> `todo`), in every mode.
- Say so in the summary and in `tests.note` ("strict reporter: empty-suite guard is a passing test").

Check: grep the generated test files for `it.todo` and `test.todo`; there is none. Run the
story suite with zero stories; it exits 0.

**Verified (addon-vitest 10.6.5, Vitest 4.1.12, Chromium):** a reporter that fails the run on
any todo or skipped test, `parameters.a11y.test: "todo"` and a story with an a11y violation (an
`<img>` with no `alt`). Result: `vitest run --project=storybook` exits 0, 7 of 7 tests pass and
the reporter counts 0 todo or skipped tests; the addon's todo is not a Vitest todo. With
`"error"` the same story fails with `image-alt`, so the violation is real; under `"todo"` it is
not printed in the terminal run, it shows in Storybook's accessibility panel and test status.
Control: a single `it.todo` in the unit project makes the same reporter exit 1. So `warn` is
safe under a strict reporter in `vitest-addon` mode, and 0.1.1's rule that took it away there
is withdrawn.
