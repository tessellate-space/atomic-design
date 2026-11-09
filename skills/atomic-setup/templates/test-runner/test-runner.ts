import type { Page } from "playwright";
import type { TestRunnerConfig } from "@storybook/test-runner";

// `test-runner` mode: Storybook's test runner opens every story of the built Storybook in
// Chromium. A story that throws, or whose play function fails, already fails the run.
// This config also fails a story that logs console.error.
const errors: string[] = [];
const watched = new WeakSet<Page>();

const config: TestRunnerConfig = {
  async preVisit(page) {
    if (watched.has(page)) return;
    watched.add(page);
    page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
  },
  async postVisit() {
    if (errors.length) throw new Error(`console.error in story: ${errors.splice(0).join(" | ")}`);
  },
};
export default config;
