// `vitest-addon` mode, local visual snapshots. Imported by `.storybook/preview`
// (see references/visual.md). Everything here is inert unless the Vitest run sets
// VITE_VISUAL, so `storybook dev` and `storybook build` are unchanged.
import type { Decorator } from "@storybook/react-vite";

const env = ((import.meta as { env?: Record<string, string | undefined> }).env ?? {});
export const visualOn = Boolean(env.VITE_VISUAL);

// "de:dark" -> { locale: "de", theme: "dark" }; one matrix cell per Vitest run.
const [locale, theme] = (env.VITE_VISUAL_GLOBALS ?? "").split(":");
export const visualGlobals: Record<string, string> = visualOn
  ? { ...(locale ? { locale } : {}), ...(theme ? { theme } : {}) }
  : {};

// Animations and transitions off, and wait until web fonts are loaded.
export const visualDecorator: Decorator = (Story) => {
  if (visualOn && !document.getElementById("atomic-visual-style")) {
    const style = document.createElement("style");
    style.id = "atomic-visual-style";
    style.textContent =
      "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}";
    document.head.appendChild(style);
  }
  return Story();
};

type Capture = (name: string, element: Element) => Promise<void>;

// Storybook runs this after the story and its play function. The Vitest setup file
// (.storybook/visual.setup.ts) registers the capture function; elsewhere it is absent.
export const visualAfterEach = async (ctx: {
  id: string;
  canvasElement: HTMLElement;
  parameters: Record<string, unknown>;
}) => {
  const capture = (globalThis as { __atomicVisualCapture?: Capture }).__atomicVisualCapture;
  if (!visualOn || !capture || ctx.parameters.visual === false) return;
  await document.fonts.ready;
  // A story that renders nothing (an empty state) leaves a 0px-tall canvas, which cannot be
  // captured; 1px keeps it in the snapshot set and fails if it starts rendering something.
  ctx.canvasElement.style.minHeight = "1px";
  const viewport = env.VITE_VISUAL_VIEWPORT ?? "desktop";
  const cell = `${locale ?? "default"}-${theme ?? "default"}-${viewport}`;
  await capture(`${ctx.id.replace(/-+/g, "-")}-${cell}`, ctx.canvasElement);
};
