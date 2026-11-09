// atomic:runner-import expect,it
import { LOCALES, THEMES, composeStories, preview, renderPass, type ComposedStory } from "./story-harness";
import * as missingKey from "./fixtures/missing-key.fixture";

// Only written for repos with i18n and two or more locales.
const pass = (locale: string) =>
  renderPass((composeStories(missingKey as never, preview as never) as Record<string, ComposedStory>).OnlyEnglish, locale, THEMES[0]);

it("fails a story with a key missing in a second locale, naming the key", async () => {
  await expect(pass(LOCALES[0])).resolves.toBeUndefined();
  await expect(pass(LOCALES[1])).rejects.toThrow(/fixture\.onlyInSourceLocale/);
});
