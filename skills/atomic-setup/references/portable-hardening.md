# Portable mode, hardened

`composeStories` renders stories in jsdom through the preview's decorators. A bare smoke
render misses what matters, so the harness (`templates/tests/story-harness.tsx`) does more:

- **Per locale x theme.** `stories.test.tsx` renders every story once for each pair. The
  globals reach the render through the composed story: `await Story.run({ canvasElement,
  globals: { locale, theme } })` (confirmed: portable stories accept a `globals` context
  per `run()`, and the preview's decorators see them). The harness also sets the language
  and the theme class itself, so it does not rely on the decorator timing.
- **Missing keys fail.** During a pass the i18n instance has `fallbackLng` off and a
  `parseMissingKeyHandler` that records the key. A key missing from the locale fails the
  test, naming the locale and the key. Without turning the fallback off a `de` key hiding
  behind `en` would pass.
- **`console.error` fails.** The harness spies on it for the render.
- **Play functions run.** `run()` renders and then runs `play`; a throwing play function
  fails the test.
- **The beforeAll hook.** The harness calls the project annotations' `beforeAll` once.

Files, rendered beside the components root (`{{...}}` from the facts):

| Template | Writes |
|---|---|
| `tests/story-harness.tsx` | the harness |
| `tests/stories.test.tsx` | the loop over every story file |
| `tests/story-harness.test.tsx`, `tests/fixtures/broken-story.fixture.tsx`, `tests/fixtures/play-fails.fixture.tsx` | proves the harness: a story that throws and a failing play function |
| `tests/story-harness-i18n.test.tsx`, `tests/fixtures/missing-key.fixture.tsx` | only with i18n and two or more locales: proves a missing-key failure |

The fixtures stay out of the stories glob on purpose (`*.fixture.tsx`, not `*.stories.tsx`).

**Jest repos:** the harness and tests use the runner's globals; `test_runner` is `jest`.
Use the Jest-compatible equivalents of `afterAll` and `it.each`; avoid `import.meta`
(`__dirname` works in both). A repo whose builder is webpack uses `test-runner` mode, not
this one.

**Check:** a fixture story whose play function fails, and one with a key missing in `de`,
each fail in this mode (the two harness tests assert exactly that).
