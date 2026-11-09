# Step 3: `.storybook/preview`, the app's context and nothing more

Import the app's stylesheet (tokens, fonts), wrap every story in the app's own i18n
instance and theme, and add two toolbar globals, `locale` and `theme`.

**Docs page:** render `templates/storybook/atomic-docs-page.tsx` beside the preview. It
shows each component's doc card (`parameters.atomic`, described in the core skill's
`references/doc-card.md`) above the props table and the live stories, and the preview sets
`tags: ["autodocs"]` and `parameters.docs.page` to it. It needs `@storybook/addon-docs` at
the same version as Storybook (step 1); in an existing Storybook that lacks it, add it
at that version and say so. An existing `docs.page` or `docs.container` is kept: tell the
developer the card will not show until `AtomicCard` is added to their page.

**Probe:** does the preview already define `globalTypes.locale` and `globalTypes.theme`
(or the repo's equivalents) and a decorator that applies them? Then "already in place".

**Act:** render `templates/storybook/preview.tsx` for a new Storybook. For an existing
preview, merge instead of replacing:

- keep its imports, parameters, loaders and decorators;
- add the `withGlobals` decorator at the end of `decorators`, and the `globalTypes` and
  `initialGlobals` entries;
- keep the file's export style. The portable harness imports the **default** export, so
  if the existing preview uses named exports, either add a default export or point
  `{{preview_import}}` at a small `preview-annotations` module.

Rules:

- No QueryClient, router or auth decorator. Needing one means the component is a container.
- No i18n in the repo: drop the locale parts (the `i18n` flag false, `no_i18n` true). One
  theme: drop the theme global (`themes` false).
- A UI-kit provider (MUI `ThemeProvider`, for example): wrap `children` in `Globals` the way the app's entry file does, using the app's own theme object. `Globals` already has a `theme` prop (the toolbar name), so import the app's object under another name (`appTheme`); using the same name shadows it and the provider receives a string.
- A theme provider other than a class on `<html>` (MUI `ThemeProvider`, a data attribute):
  apply the theme in `Globals` the way the app does. The toolbar item names still come
  from the map's `themes`.
- Locales and themes come from the map. Never leave the worked example's values.

**Check:** a component with `parameters.atomic` shows its card on the docs page; a story renders under each locale and theme global with the copy and tokens of
that locale and theme; `build-storybook` exits 0 with the backend stopped (no network).
