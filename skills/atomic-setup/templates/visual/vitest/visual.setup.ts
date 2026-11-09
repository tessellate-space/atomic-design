// Vitest setup file of the `visual` project (vitest-addon mode). It gives the preview's
// `afterEach` hook a way to take the screenshot with Vitest's browser-mode assertion.
import { expect } from "vitest";
import { page } from "vitest/browser";

(globalThis as Record<string, unknown>).__atomicVisualCapture = async (name: string, element: Element) => {
  await expect.element(page.elementLocator(element)).toMatchScreenshot(`${name}.png`);
};
