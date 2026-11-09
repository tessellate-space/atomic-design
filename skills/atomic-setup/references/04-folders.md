# Step 4: folders per level

Use the folders the level map names. Create only the ones that do not exist, and only
when the map points at them and they are empty candidates for later components. Move
nothing: migration is a separate change.

- Atoms stay where the UI kit writes them (`components.json` `aliases.ui`, a package, a
  themed wrapper folder). Moving them breaks `npx shadcn add`.
- Feature folders keep their containers and any component not yet migrated.
- A repo with feature-sliced folders (`shared/ui`, `features/*/ui`) keeps them: the map
  globs point at them, and nothing under `src` moves.

**Probe:** do all folders in the map's `levels` exist, or are intentionally absent? Then
"already in place".

**Check:** `ls` of each mapped folder that should exist succeeds. The Foundations story
is a later command (`atomic-design:foundations`); do not write it here.
