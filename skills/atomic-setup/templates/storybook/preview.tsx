import { useEffect, type ReactNode } from "react";
// atomic:if i18n
import { I18nextProvider } from "react-i18next";
import i18n from "{{i18n_module}}";
// atomic:end
import type { Decorator, Preview } from "@storybook/react-vite";
import { AtomicDocsPage } from "./atomic-docs-page";
// atomic:if styles
import "{{styles_import}}";
// atomic:end

// The app's own context and nothing more. No QueryClient, router or auth decorator:
// needing one is the sign the component is a container.
function Globals({ locale, theme, children }: { locale: string; theme: string; children: ReactNode }) {
  // atomic:if i18n
  useEffect(() => { void i18n.changeLanguage(locale); }, [locale]);
  // atomic:end
  // atomic:if themes
  useEffect(() => { document.documentElement.classList.toggle("{{dark_class}}", theme === "dark"); }, [theme]);
  // atomic:end
  void locale; void theme;
  // The app's other providers (a UI kit's ThemeProvider, for example) wrap `children` here,
  // the way the app's entry file wraps them. Data providers never go here.
  // atomic:if i18n
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
  // atomic:end
  // atomic:if no_i18n
  return <>{children}</>;
  // atomic:end
}

const withGlobals: Decorator = (Story, ctx) => (
  <Globals locale={String(ctx.globals.locale ?? "{{default_locale}}")} theme={String(ctx.globals.theme ?? "{{default_theme}}")}>
    <Story />
  </Globals>
);

const preview: Preview = {
  decorators: [withGlobals],
  globalTypes: {
    // atomic:if i18n
    locale: { toolbar: { title: "Locale", icon: "globe", items: {{locales_json}}, dynamicTitle: true } },
    // atomic:end
    // atomic:if themes
    theme: { toolbar: { title: "Theme", icon: "circlehollow", items: {{themes_json}}, dynamicTitle: true } },
    // atomic:end
  },
  initialGlobals: { locale: "{{default_locale}}", theme: "{{default_theme}}" },
  // The docs page shows the doc card (parameters.atomic) above the props table and the stories.
  tags: ["autodocs"],
  parameters: {
    docs: { page: AtomicDocsPage },
    // atomic:if vitest_addon
    a11y: { test: "{{a11y_test}}" },
    // atomic:end
  },
};
export default preview;
