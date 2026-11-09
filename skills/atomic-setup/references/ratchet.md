# The ratchet baseline

A boundary test that fails on day one gets switched off. Setup therefore records today's
violations in a committed file; after that, debt can only shrink.

## Format

`.atomic-design-baseline.json` (path in the map's `baseline`): an array of
`{ "rule", "file", "detail" }`. `detail` is the forbidden import specifier, or
`no stories file`. Entries are sorted.

## Writing it, once

After the checker and `library-complete.test` are in place and the map is confirmed:

```bash
ATOMIC_BASELINE_INIT=1 <tests.boundary>
```

That writes the file from the current `error`-severity violations and stops. It refuses to
overwrite an existing file, so it cannot be used to hide new violations. Review the list
with the developer: it should be exactly the known debt (`atomic-boundaries` tests say
which). `warn` and `off` rules are not baselined: warnings are printed on every run.

A rule added after setup (for example `tokens-only`, from foundations, or
`i18n-no-hardcoded-strings`) records its debt the
same way, once: `ATOMIC_BASELINE_INIT=<rule id> <tests.boundary>` adds only that rule's
entries to the existing file and refuses to run again once the rule has entries.

For `i18n-no-hardcoded-strings` the scope decides what is recorded, so settle `i18n.scope`
first (`05-boundaries.md`): `ATOMIC_BASELINE_INIT=i18n-no-hardcoded-strings` records the hits
in the files that scope covers, and refuses to run a second time. Widening the scope to `app`
afterwards makes the container and page hits fail as new debt; tell the developer, who decides
whether to fix them. Details are the text, so editing a string moves its entry: that is a new
hit and a fixed one, and the suite reports both.

## What the suite does with it

- A violation not in the baseline: fails, naming rule, file and import (new debt).
- A baseline entry that no longer occurs: fails with "remove this entry from the baseline:
  fixed", so every fix is recorded.
- Baseline entries for rules at `warn` or `off` are ignored.
- `data-in-containers` is always `error`; the baseline is the only way to relax it.

## Rules about the file

- Never add an entry by hand to make a failure go away; fix the code, or tell the
  developer the debt is new.
- Remove an entry when its violation is fixed. An empty file is the goal.
- ESLint reads the same file (`eslint.md`), so baselined files show warnings, not errors.
- A review (a later change) flags a diff that grows the baseline.

## Seeing warnings

`warn` rules print a summary through `console.warn` in `library-complete`. Vitest 4 hides the
console output of passing tests when it detects an AI agent in the environment; run with
`--reporter=default` (or in a normal terminal) to see the list.
