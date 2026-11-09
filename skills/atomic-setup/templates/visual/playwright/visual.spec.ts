import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

type Entry = { id: string; type: string };
const config = JSON.parse(readFileSync("visual/visual.config.json", "utf8")) as {
  combos: [string, string][];
};
const index = JSON.parse(readFileSync("storybook-static/index.json", "utf8")) as { entries: Record<string, Entry> };
const stories = Object.values(index.entries).filter((e) => e.type === "story");

// "default" means the repo has no switch for that global: nothing is passed.
const globalsOf = (locale: string, theme: string) =>
  [locale !== "default" && `locale:${locale}`, theme !== "default" && `theme:${theme}`].filter(Boolean).join(";");

for (const story of stories) {
  for (const [locale, theme] of config.combos) {
    test(`${story.id} ${locale} ${theme}`, async ({ page }, info) => {
      await page.goto(`/iframe.html?id=${story.id}&viewMode=story&globals=${globalsOf(locale, theme)}`);
      // Storybook's render lifecycle: wait for the play function and afterEach to finish.
      await page.waitForFunction(() => {
        const phase = (window as any).__STORYBOOK_PREVIEW__?.currentRender?.phase;
        return ["completed", "finished", "errored", "aborted"].includes(phase);
      });
      // `parameters.visual = false` opts a story out.
      const optedOut = await page.evaluate(
        () => (window as any).__STORYBOOK_PREVIEW__?.currentRender?.story?.parameters?.visual === false,
      );
      test.skip(optedOut, "parameters.visual = false");
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator("#storybook-root")).toHaveScreenshot(
        `${story.id.replace(/-+/g, "-")}-${locale}-${theme}-${info.project.name}.png`,
      );
    });
  }
}
