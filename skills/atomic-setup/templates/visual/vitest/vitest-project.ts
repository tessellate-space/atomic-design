// Reference for the `visual` Vitest project (`vitest-addon` mode). Add it next to the
// `unit` and `storybook` projects; the "storybook" project stays as it is.
// The viewport and the matrix cell come from the environment that scripts/visual.sh sets.
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";

const viewports = {{visual_viewports_json}} as Record<string, { width: number; height: number }>;
const viewport = viewports[process.env.VITE_VISUAL_VIEWPORT ?? "desktop"] ?? Object.values(viewports)[0];

export const visualProject = {
  extends: true,
  plugins: [storybookTest({ configDir: fileURLToPath(new URL("{{storybook_dir_rel}}", import.meta.url)) })],
  test: {
    name: "visual",
    setupFiles: ["{{storybook_dir_rel}}/visual.setup.ts"],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({}),
      instances: [{ browser: "chromium" }],
      viewport,
      expect: {
        toMatchScreenshot: {
          resolveScreenshotPath: ({ arg, ext, root }: { arg: string; ext: string; root: string }) =>
            `${root}/visual/baselines/${arg}${ext}`,
          resolveDiffPath: ({ arg, ext, root }: { arg: string; ext: string; root: string }) =>
            `${root}/visual/results/${arg}${ext}`,
        },
      },
    },
  },
};
