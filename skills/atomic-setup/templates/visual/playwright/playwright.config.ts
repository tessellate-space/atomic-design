import { readFileSync } from "node:fs";
import { defineConfig } from "@playwright/test";

const { viewports } = JSON.parse(readFileSync("visual/visual.config.json", "utf8")) as {
  viewports: Record<string, { width: number; height: number }>;
};

// Visual snapshots of the built Storybook (modes `test-runner` and `portable`).
// Run through scripts/visual.sh so the browser is the pinned image.
export default defineConfig({
  testDir: ".",
  testMatch: "visual.spec.ts",
  snapshotPathTemplate: "{testDir}/baselines/{arg}{ext}",
  outputDir: "./results",
  fullyParallel: true,
  retries: 0,
  reporter: [["list"]],
  expect: { toHaveScreenshot: { animations: "disabled", caret: "hide" } },
  webServer: { cwd: process.cwd(), command: "node visual/serve.mjs storybook-static 6007", url: "http://127.0.0.1:6007/index.json", reuseExistingServer: false },
  use: { baseURL: "http://127.0.0.1:6007" },
  projects: Object.entries(viewports).map(([name, viewport]) => ({
    name,
    use: { browserName: "chromium" as const, viewport },
  })),
});
