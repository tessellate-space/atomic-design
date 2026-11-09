# Vitest 3 to 4 upgrade (its own step)

Only on a Vite repo with Vitest 3, and only when the developer says yes. Never fold it into
another step. If declined, record `tests.upgradeDeclined: true` and use `portable`.

**Why:** `@storybook/addon-vitest` for Storybook 10.6 declares peers `vitest ^4 || ^5`,
`@vitest/browser` and `@vitest/browser-playwright` `^4 || ^5`. It does not install on Vitest 3.

**Act:**

1. Run the unit suite first and note the result. If it is already red, stop and report.
2. Install exact, matching versions, all three at the same patch (npm fails with an
   `ERESOLVE` peer conflict otherwise):

   ```bash
   V=$(npm view vitest@4 version | tail -1 | awk '{print $2}' | tr -d "'")
   npm i -D --save-exact vitest@$V @vitest/browser@$V @vitest/browser-playwright@$V playwright
   ```

   (With a single 4.x published, `npm view vitest@4 version` prints just the version.)
3. Run the full unit suite. Any failure: stop, show it, let the developer decide; do not
   patch tests to make it pass. Roll back with `git checkout package.json
   package-lock.json` and install, then use `portable`.
4. Mind Vitest 4 changes: a `vitest.workspace` file is replaced by `test.projects`; the
   config loader warns about `__dirname` in an ESM config (use `import.meta.dirname`).

**Check:** `npx vitest --version` prints 4.x, the unit suite is as green as before, and
`git diff package.json` shows only exact versions.
