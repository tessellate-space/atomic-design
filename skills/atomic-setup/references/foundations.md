# Foundations: tokens, guidance, story and the literal check

Used by `/atomic-design:foundations`. Needs the level map from setup (`.atomic-design.json`);
if it is missing, run setup first. Like setup, every step probes first and a rerun
changes nothing that is already in place. Nothing is written before the questions in step 2
are answered, and in `code-first` mode nothing is written before the reviewer approves.

## Step 1: find the tokens (D1)

Probe in this order and stop at the first source that defines colour:

1. CSS custom properties in the stylesheet entry (`facts.md`: "Stylesheet with tokens"):
   `--name: value` on `:root` or a theme class. Source `css-vars`.
2. Tailwind: an `@theme` block (v4) or `theme.extend` in the config. Source `tailwind`.
3. A theme object: `createTheme(` or a `ThemeProvider` with a `theme` prop. Source
   `theme-object`; the path is the file that creates the theme.

If two sources define colour, ask which is canonical and report the other as a finding
(for example, "a theme object also sets `palette.primary`, not used by the stylesheet").
Record the result in the map, validated like any map change:

```json
"tokens": { "source": "tailwind", "path": "src/styles.css", "grid": 4, "exempt": [] }
```

`theme-object` also records `export` (the exported name, default `theme`). `path` lists
every file that defines tokens; those files are exempt from `tokens-only`. A theme object
that exists but whose palette is thin does not make the repo token-less: tokens that exist
are used as they are, and the literals around them are the debt (step 5).

**No tokens at all:**

- `figma` or `styleguide` mode: ask where the design source is (a Figma file, a styleguide
  URL or document) and create the tokens from it in the format the repo already uses
  (CSS variables when it has Tailwind or plain CSS, a theme object when it has a UI kit).
  Never invent values the source does not give.
- `code-first` mode: step 4.

## Step 2: questions, in one batch

Ask only what the map and the code do not answer: the canonical source if there are two;
the spacing grid (4 or 8; the code often shows it: if most paddings are multiples of 8 say
so and propose 8); the exempt globs (icon files and the like). For Tailwind, whether to switch `@theme` to `@theme static` (step 6). Show the `tokens` block
before writing it.

## Step 3: guidance in `docs/foundations.md` (D2)

Render `templates/foundations/foundations.md` into `docs/foundations.md` (skip when the file
exists; a rerun may only add groups that are missing) and fill it **from the code**:

- Colour by role: surface, text, accent, state (and border). For every token, count where it
  is used and write what the usage shows, for example "`--color-brand` is used on 14 buttons
  and 2 links". Under "use for" list the uses you found; under "never for" list only what the
  code or the design source supports (for example text on a surface it fails contrast
  on). The type scale with each step's observed uses, the spacing grid, radii and elevation
  are filled the same way.
- Anything the code cannot back, for example a "never for" rule or the purpose of an unused
  token, is written as `needs design input` and nothing else. **Never invent a rule and
  present it as settled.**
- A group the source does not have (no elevation tokens) says so in one line.
- The header status stays `draft`. In the summary tell the team to review the file with
  design, and name `design.reviewer` from the map as the person to ask.

## Step 4: tokens from code (`code-first`, no tokens) (D5)

```
python3 ${CLAUDE_SKILL_DIR}/scripts/cluster_tokens.py . [--grid 8] [--delta-e 3] [--exclude GLOB]
```

It scans the whole repo, converts colour literals to OKLCH-space (OKLab) and clusters them
by perceptual distance (default deltaE below 3), rounds spacing and radius values to the
grid, names each colour cluster by role from the property it is used with, and prints
tables: token, value (the most-used member), the literals it absorbs with usage counts.
`--json` gives the same data.

1. Write the output into `docs/foundations-proposal.md` using
   `templates/foundations/foundations-proposal.md` as the frame, and open it with the
   headline ("14 greys collapse to 4").
2. Read the clusters yourself before showing them: roles are guessed from the property, so
   say where a merge looks wrong (white merged into a near-white, a text colour merged into
   a surface). The reviewer can split a cluster.
3. **Stop.** Name the reviewer from `design.reviewer` and ask for approval of the whole set
   or of the changes requested. Write nothing else until they answer.
4. After approval: write the tokens in the detected format (a `:root` block or `@theme` in
   the stylesheet entry, or the palette of the existing theme object), record `tokens` in
   the map, set `rules.tokens-only` to `error`, and baseline the existing literals (step 5).
   Do not replace literals in components: migrating them is a later change.
   Add no value the proposal did not show.
5. Mark the proposal approved (name and date) and keep it in `docs/`.

## Step 5: the literal check (D4)

The `tokens-only` rule is part of the checker template (`templates/lib/atomic-boundaries.ts`,
fixture tests in `atomic-boundaries.test.ts`). It flags a colour literal (hex, `rgb()`,
`rgba()`, `hsl()`, `hsla()`, `oklch()`, `oklab()`, `lab()`, `lch()`) or an ad-hoc
`font-family` (a family that is not `var(...)` or `inherit`) in `.ts`, `.tsx`, `.js`, `.jsx`
and `.css` files under the library levels, skipping tests, stories and containers. One
violation is recorded per distinct literal per file, with the literal as its detail.

**Probe:** does the checker in the repo have the `tokens-only` rule? If it is an older copy, re-render
the checker and its test from the templates (setup step 5) and rerun that test; this is an
addition to `RULES`, so the other rules are untouched. If the new copy also brings rules that
foundations did not add (a later change's rule, for example `doc-card`), they are not this
command's to baseline: report their violations, leave the baseline alone for them, and ask the
developer whether to set them to `warn` or `off` in the map for now.

1. Make sure the map has `tokens.path` (the files that define tokens are exempt) and
   `tokens.exempt` for files that legitimately hold colour (icons, charts, email templates).
   Report each exemption to the developer; each one is a hole.
2. Run the boundary command. Literals that already exist fail the suite on purpose.
   Record them once: `ATOMIC_BASELINE_INIT=tokens-only <tests.boundary>`. If the baseline file
   does not exist yet this writes it (use `=1` to baseline every rule); if it exists it adds
   only the `tokens-only` entries, leaves the others alone, and refuses to run a second time
   once the rule has entries. This is the one allowed addition to a baseline, because the
   rule is new; say so in the summary with the count. Review the list with the developer.
3. The suite is green again. Every migration afterwards removes entries.

Severity: `rules.tokens-only` defaults to `error`; `warn` prints the list on every run
(`ratchet.md`), `off` skips it.

## Step 6: the Foundations story (D3)

Needs Storybook (setup step 1). Render one of the templates into
`<components_root>/foundations/foundations.stories.tsx`:

| Token source | Template | Reads |
|---|---|---|
| `css-vars`, `tailwind` | `templates/foundations/foundations.stories.tsx` | the custom properties declared on `:root` and the theme class, resolved with `getComputedStyle` at render time, regrouped on theme switches and stylesheet edits |
| `theme-object` | `templates/foundations/foundations-theme.stories.tsx` | the imported theme: palette, typography, spacing, shape, shadows |

The story is never a copied list. **Check:** add a token to the source (a colour, then remove
it again); it appears on `Foundations/Tokens` without editing the story. Story tests render
it like any story; in `portable` mode jsdom has no layout and no compiled stylesheet, so the
groups are empty there and the check of "a token appears" needs a Storybook run.

**Tailwind 4 only emits the theme variables something uses**, so a token nobody has used yet
is missing from the stylesheet and from the story. Offer `@theme static` in place of
`@theme` (one word; every variable is then emitted, at a few bytes per unused token). It
edits the team's stylesheet, so ask in step 2 and do it only on a yes; without it, a new
token appears on the story as soon as a class uses it.

The story file exports only the story: Storybook treats every other named export as a story.

New facts for the templates are listed in `facts.md` (`theme_import`, `theme_export`,
`token_source`, `token_path`, `grid`, `reviewer`, `design_mode`, `delta_e`).

## Finish

Run the unit suite and the boundary command; report the tokens source and path, the
sections of `docs/foundations.md` still marked `needs design input` (count), the number of
`tokens-only` baseline entries, and the exemptions. Do not commit.
