# Step 6: story tests, in the strongest mode the repo supports

Pick the mode with `test-modes.md`, record it in the map (`tests.mode`, `tests.stories`,
and `tests.note` when it is not `vitest-addon`), and follow that mode's section.

**Probe:** `tests.mode` already recorded and its files present? Then "already in place".
A recorded `tests.upgradeDeclined: true` means do not offer the upgrade again.

**Check (every mode):** a story that throws turns the suite red naming the story; a story
whose play function fails turns it red; the suite lists one test per story (per locale and
theme in `portable`).
