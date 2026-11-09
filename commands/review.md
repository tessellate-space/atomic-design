---
description: Review a diff, branch or path against the atomic design rules the tests cannot check, and list what the designer signs off.
argument-hint: "[git range | branch | path] (default: the working diff)"
---

Use the `atomic-design` skill and follow its `references/review.md` for this input:
$ARGUMENTS

If no input was given, review the working diff. Read `.atomic-design.json` first; if the
repo has none, say so and suggest `/atomic-design:setup`. Stay read-only: edit nothing and
post nothing. Report suite rules as failing or warned tests, not as findings, give every
finding as `file:line - rule-id - what - fix`, and end with the sign-off list for the
map's `design.reviewer`. For deprecated components and removals follow `references/lifecycle.md`.
