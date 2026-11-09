// atomic:runner-import describe,it
import { LOCALES, THEMES, composeStories, preview, renderPass, type ComposedStory } from "./test/story-harness";

// Every story renders once per locale x theme through the preview's own decorators.
// A story that throws, logs console.error, lacks a translation key or fails its play
// function turns the normal unit gate red. No Storybook server, no browser.
const modules = import.meta.glob("{{stories_glob_rel}}", { eager: true });

// A repo with no stories yet still passes; the boundary test is what asks for them.
// Empty-suite guard: {{empty_suite}}.
// atomic:if empty_suite_todo
if (Object.keys(modules).length === 0) it.todo("no stories yet");
// atomic:end
// atomic:if empty_suite_pass
if (Object.keys(modules).length === 0) it("no stories yet", () => {});
// atomic:end

for (const [file, mod] of Object.entries(modules)) {
  const stories = composeStories(mod as never, preview as never) as Record<string, ComposedStory>;
  describe(file, () => {
    for (const [name, Story] of Object.entries(stories)) {
      for (const locale of LOCALES) {
        for (const theme of THEMES) {
          it(`${name} [${locale}, ${theme}]`, async () => {
            try { await renderPass(Story, locale, theme); }
            catch (e) { throw new Error(`story "${file} > ${name}" failed in ${locale}/${theme}: ${(e as Error).message}`); }
          });
        }
      }
    }
  });
}
