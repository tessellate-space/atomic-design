// atomic:runner-import describe,expect,it
import { LOCALES, THEMES, composeStories, preview, renderPass, type ComposedStory } from "./story-harness";
import * as broken from "./fixtures/broken-story.fixture";
import * as playFails from "./fixtures/play-fails.fixture";

// Proves the harness: the fixtures live outside the stories glob on purpose.
const pass = (mod: object, name: string, locale = LOCALES[0], theme = THEMES[0]) =>
  renderPass((composeStories(mod as never, preview as never) as Record<string, ComposedStory>)[name], locale, theme);

describe("story harness", () => {
  it("renders a good story", async () => { await expect(pass(broken, "Renders")).resolves.toBeUndefined(); });
  it("fails a story that throws", async () => { await expect(pass(broken, "Throws")).rejects.toThrow(); });
  it("fails a story whose play function fails", async () => { await expect(pass(playFails, "Plays")).rejects.toThrow(/play/i); });
});
