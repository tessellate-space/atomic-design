---
description: Find the design tokens (or propose them from the code), write usage guidance, add a live Foundations story and forbid colour literals in the library.
argument-hint: "[answers to the foundations questions, optional]"
---

Use the `atomic-setup` skill's foundations procedure to document and enforce this repository's design tokens.

Follow `references/foundations.md` of that skill from step 1. It needs the level map from `/atomic-design:setup`; if `.atomic-design.json` is missing, say so and stop. Find the existing tokens first and never invent values. In `code-first` mode with no tokens, write the proposal to `docs/foundations-proposal.md` and write nothing else until the reviewer named in the map approves it. Ask all questions in one batch. If the developer passed answers with the command, use them instead of asking again: $ARGUMENTS

A second run must report every step as already in place and change no file.
