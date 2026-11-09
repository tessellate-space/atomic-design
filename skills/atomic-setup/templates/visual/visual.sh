#!/usr/bin/env sh
# Visual snapshots, captured inside one pinned browser image so the pixels match on every
# machine and in CI.   scripts/visual.sh compare   fail on any difference
#                      scripts/visual.sh update    rewrite the baselines (review them, commit them)
set -eu
IMAGE="mcr.microsoft.com/playwright:v{{playwright_version}}-noble"
ACTION="${1:-compare}"
case "$ACTION" in update | compare | --inside) ;; *) echo "usage: scripts/visual.sh [compare|update]" >&2; exit 2 ;; esac

if [ "$ACTION" != "--inside" ]; then
  docker info > /dev/null 2>&1 || { echo "Docker is not running. Start it, or use the CI job to update baselines." >&2; exit 2; }
  VOLUME="atomic-visual-modules-$(basename "$PWD" | tr -c 'A-Za-z0-9\n' '-')"
  exec docker run --rm --ipc=host -v "$PWD":/work -v "$VOLUME":/work/node_modules -w /work \
    -e STORYBOOK_DISABLE_TELEMETRY=1 -e CI=1 -e HOST_UID="$(id -u)" -e HOST_GID="$(id -g)" \
    "$IMAGE" sh scripts/visual.sh --inside "${2:-$ACTION}"
fi

ACTION="${2:-compare}"
# Dependencies live in a Linux-only volume; reinstall when the lockfile is newer.
[ node_modules/.package-lock.json -nt {{lockfile}} ] || {{install_command}}
rm -rf visual/results
status=0
# atomic:if vitest_addon
CELLS=$(node -e '
const c = require("./visual/visual.config.json");
for (const vp of Object.keys(c.viewports)) for (const [l, t] of c.combos) console.log(`${l}:${t}:${vp}`);
')
for cell in $CELLS; do
  locale="${cell%%:*}"; rest="${cell#*:}"; theme="${rest%%:*}"; viewport="${rest#*:}"
  VITE_VISUAL=1 VITE_VISUAL_GLOBALS="$locale:$theme" VITE_VISUAL_VIEWPORT="$viewport" \
    {{visual_vitest_command}} $( [ "$ACTION" = update ] && echo "-u" ) || status=1
done
# atomic:end
# atomic:if playwright_spec
{{storybook_build_command}}
npx playwright test -c visual/playwright.config.ts $( [ "$ACTION" = update ] && echo "--update-snapshots" ) || status=1
# atomic:end
chown -R "${HOST_UID:-0}:${HOST_GID:-0}" visual storybook-static 2> /dev/null || true
exit "$status"
