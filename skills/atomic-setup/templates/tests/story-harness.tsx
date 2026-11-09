import { composeStories, setProjectAnnotations } from "@storybook/react";
// atomic:if i18n
import i18n from "{{i18n_module}}";
// atomic:end
import preview from "{{preview_import}}";

// Portable-mode harness: renders one story in one locale and theme in jsdom.
// Fails on a missing translation key, on console.error, and on a failing play function.
export const LOCALES: string[] = {{locales_json}};
export const THEMES: string[] = {{themes_json}};

const project = setProjectAnnotations([preview as never]);
let ready: Promise<void> | undefined;

export type ComposedStory = { run: (ctx?: Record<string, unknown>) => Promise<void> };

export async function renderPass(Story: ComposedStory, locale: string, theme: string) {
  ready ??= Promise.resolve(project.beforeAll?.()).then(() => undefined);
  await ready;
  const missing: string[] = [];
  const errors: string[] = [];
  const realError = console.error;
  console.error = (...args: unknown[]) => { errors.push(args.map(String).join(" ")); };
  // atomic:if i18n
  const options = i18n.options as unknown as Record<string, unknown>;
  const saved = { fallbackLng: options.fallbackLng, parseMissingKeyHandler: options.parseMissingKeyHandler };
  options.fallbackLng = false; // a key missing in this locale must not hide behind the source locale
  options.parseMissingKeyHandler = (key: string) => { missing.push(key); return key; };
  // atomic:end
  const canvasElement = document.body.appendChild(document.createElement("div"));
  try {
    // atomic:if i18n
    await i18n.changeLanguage(locale);
    // atomic:end
    document.documentElement.classList.toggle("{{dark_class}}", theme === "dark");
    await Story.run({ canvasElement, globals: { locale, theme } });
  } finally {
    console.error = realError;
    // atomic:if i18n
    Object.assign(options, saved);
    // atomic:end
    canvasElement.remove();
  }
  if (missing.length) throw new Error(`missing translation key(s) in "${locale}": ${[...new Set(missing)].join(", ")}`);
  if (errors.length) throw new Error(`console.error during render: ${errors[0]}`);
}

export { composeStories, preview };
