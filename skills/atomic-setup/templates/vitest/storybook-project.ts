// Reference for the `vitest-addon` mode, used only when `npx storybook add @storybook/addon-vitest`
// could not edit the config itself (for example a separate vitest.config.ts or a workspace file).
// Two projects in one config: "unit" (the existing jsdom suite, unchanged) and "storybook"
// (every story as a test in headless Chromium). Run: vitest run --project=unit | --project=storybook
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // ...the app's existing plugins and resolve.alias stay at the top level; projects extend them.
  test: {
    // Required at this level: with no stories yet, `--project=storybook` must exit 0, not "No test files found".
    passWithNoTests: true,
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          // ...the existing `test` options (environment, setupFiles, include) move here unchanged
        },
      },
      {
        extends: true,
        plugins: [storybookTest({ configDir: fileURLToPath(new URL("{{storybook_dir_rel}}", import.meta.url)) })],
        test: {
          name: "storybook",
          browser: { enabled: true, headless: true, provider: playwright({}), instances: [{ browser: "chromium" }] },
        },
      },
    ],
  },
});
