---
description: Snapshot every story and review image diffs - local baselines in a pinned Docker image, an upgrade to Chromatic, or off.
argument-hint: "[local | chromatic | off]"
---

Use the `atomic-setup` skill and follow its `references/visual.md` for this input: $ARGUMENTS

Read `.atomic-design.json` first; if the repo has none, say so and suggest
`/atomic-design:setup`. With no argument, report the map's `visual.mode` and what it
means. Probe before writing, ask once, and never tick a step whose check did not run.
Never create a Chromatic account, ask for its token or call its API; `chromatic` writes the
CI step and leaves the secret to the team. Removing local baselines needs the developer's
explicit yes.
