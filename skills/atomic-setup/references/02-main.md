# Step 2: `.storybook/main`, built from the app's Vite config

Vite builder only. On any other builder skip this step and step 2's dev-config test,
say so, and carry on (`existing-repo.md`).

The Vite builder already loads the app's Vite config and merges it before `viteFinal`
runs, so the app config is the single source of plugins. Add a plugin only if it is
missing.

**Probe:** does `.storybook/main.*` already have a guarded `viteFinal`, the absolute alias
and the widened story glob? Then report "already in place".

**Act:** render `templates/storybook/main.ts` (new Storybook) or merge its parts into
the existing file:

- `stories`: widen to every `*.stories.@(ts|tsx)` under the components root. Keep
  existing entries.
- `viteFinal`: add each plugin the app config lacks, guarded by name, then the absolute
  alias. Merge into an existing `viteFinal`; never replace it.
- Which plugins to guard: those the Storybook build needs that the app config does not
  already bring, usually `@vitejs/plugin-react` (names `vite:react-babel`, `vite:react-swc`)
  and `@tailwindcss/vite` (`@tailwindcss/vite:scan`). The dev-config test counts the names
  in `{{guarded_plugins_json}}`; list the plugin names the app config actually loads.
- Keep the router plugin the app brings.
- The alias must be absolute (`resolve(import.meta.dirname, "../src")`); a root-relative
  one like `"/src"` works only while Storybook's root is the app folder.

**Pitfall (double refresh):** appending `react()` unconditionally loads React fast
refresh twice. The dev preview dies with `Uncaught SyntaxError: Identifier
'RefreshRuntime' has already been declared` and spins; `storybook build` stays green
because production builds have no refresh preamble. That is why the dev-config test exists.

**Check:** write `templates/tests/storybook-dev-config.test.ts` (it runs under Node, never
starts a server) and run it. Then, once, start `storybook dev`, open one story and
confirm the browser console has no error (headless Chromium is fine).
