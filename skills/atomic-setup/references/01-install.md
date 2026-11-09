# Step 1: Storybook, pinned exactly

**Probe:** `storybook` in `package.json`? If yes, keep the installed version and stories,
record the version, and go to step 2 (`existing-repo.md`). Never reinstall or upgrade it.

**Act (no Storybook, Vite builder):**

```bash
npm i -D --save-exact storybook@<10.x> @storybook/react-vite@<same> @storybook/react@<same> @storybook/addon-docs@<same>
```

- Pin one exact version for all three; commit the lockfile. Use the repo's package manager.
- `@storybook/addon-docs` is needed for the docs page that shows each component's doc card
  (step 3); add it to `addons` in `.storybook/main` (step 2). Add no other addon you do not
  use. The locale and theme switches need none. The test addons are
  chosen in step 6 by the test mode.
- Add scripts `storybook` (dev server on a port nothing else uses) and `build-storybook`.
- Non-Vite builder with no Storybook: stop and report. Setup does not choose a builder
  for the team (`existing-repo.md`).

**Check:** `npx storybook --version` prints the pinned version; the new `package.json`
entries have no `^`.
