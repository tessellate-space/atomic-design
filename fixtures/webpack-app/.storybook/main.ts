import type { StorybookConfig } from "@storybook/react-webpack5";

const config: StorybookConfig = {
  framework: "@storybook/react-webpack5",
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  // Transpiles TS and JSX with the app's own Babel config.
  addons: ["@storybook/addon-webpack5-compiler-babel"],
  // css-loader 7 exports CSS-module classes as named exports by default, so
  // `import styles from "./x.module.css"` is undefined. Same options as webpack.config.cjs.
  webpackFinal: async (config) => {
    for (const rule of config.module?.rules ?? []) {
      if (!rule || typeof rule !== "object" || !Array.isArray(rule.use)) continue;
      for (const use of rule.use) {
        if (use && typeof use === "object" && typeof use.loader === "string" && use.loader.includes("css-loader")) {
          use.options = { ...(use.options as object), modules: { auto: true, namedExport: false, exportLocalsConvention: "as-is" } };
        }
      }
    }
    return config;
  },
};
export default config;
