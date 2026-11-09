# Rules

Each rule has an id. Cite rules only by these ids; later docs, findings and the
rules doc written into a repo all use them. Severity per rule is set in
`.atomic-design.json` under `rules`: `error` fails the suite, `warn` is
reported, `off` is ignored.

Three tiers: **suite** rules are decided by a machine and tested; **editor**
rules are shown by lint in the editor; **review** rules are judgment and only ever
advise. Judgment never fails a build.

### `atomic-components`

- Tier: suite. Default: `error`.
- Check: library files (atoms, molecules, organisms, templates) live in the folders
  the level map names, and a library file never imports a container or a page.

### `data-in-containers`

- Tier: suite and editor. Default: `error`. Only `error` is accepted.
- Check: a library file imports no module listed in `dataModules`. The rule can
  be relaxed only through the baseline of known violations, never switched off.

### `stories-for-every-state`

- Tier: suite. Default: `error`.
- Check: every library component has a story, and each meaningful state (empty,
  loading, error, long text, disabled) has one that renders.

### `tokens-only`

- Tier: suite. Default: `error`.
- Check: library files use design tokens, with no colour literal (hex, rgb, hsl).

### `i18n-no-hardcoded-strings`

- Tier: suite. Default: `error`.
- Check: user-facing text in library files comes from the translation function or
  from props; stories render in every locale the level map lists. The suite flags JSX
  text that contains a letter (`<button>Close</button>`, also `<span className="sr-only">Close</span>`)
  and string literals given to `aria-label`, `title`, `placeholder` and `alt`. It ignores
  `{expressions}`, `<Trans>` content, numbers, punctuation and units, and strings in
  `i18n.allow`. The `i18n` block of the map sets `scope` (`library`, the default, or `app`,
  which adds containers and pages), `attributes`, `allow` and `exempt`. The check is a
  text scan, not a parse: it does not look inside `{}` expressions, so a wrong hit goes in
  `allow` or `exempt`, never in a disabled rule.

### `doc-card`

- Tier: suite. Default: `error`.
- Check: every library component has a doc card (`parameters.atomic` in its story file).
  The suite fails on a missing `status` or `owner`; the other card fields are advice.

### `pattern-before-component`

- Tier: review. Default: advice only.
- Check: a new component names the pattern it serves and says whether the product
  already has one.

### `structural-names`

- Tier: review. Default: advice only.
- Check: the name says what the component is, not where it first appeared.

### `single-responsibility`

- Tier: review. Default: advice only.
- Check: one job per component; a component that must behave very differently by
  screen size becomes two components, not a pile of variant props. A count above
  the repo's `review.maxVariantProps` is a prompt to look, not a failure.

### `component-lifecycle`

- Tier: review. Default: advice only.
- Check: a component has a status (experimental, stable, deprecated); deprecated ones name
  their replacement, and a reviewer approves the move to stable.

Distilled from a 2024 cross-disciplinary atomic design study group and production use.
