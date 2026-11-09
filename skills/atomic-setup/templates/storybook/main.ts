import { resolve } from "node:path";
{{plugin_imports}}
import type { Plugin, PluginOption } from "vite";
import type { StorybookConfig } from "@storybook/react-vite";

const flatten = (plugins: PluginOption[] | undefined): Plugin[] =>
  (plugins ?? []).flat(Infinity as 1).filter(
    (p): p is Plugin => !!p && typeof p === "object" && "name" in p,
  );

// The Vite builder already loads the app's vite config and merges it before viteFinal
// runs. Add a plugin only when it is missing, or React refresh loads twice and the dev
// preview dies with "Identifier 'RefreshRuntime' has already been declared".
const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: ["../{{components_root}}/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs"], // the docs page that shows each component's doc card
  viteFinal: async (vite) => {
    const has = (name: string) => flatten(vite.plugins).some((p) => p.name === name);
    vite.plugins = [
      ...(vite.plugins ?? []),
{{guarded_plugins}}
    ];
    vite.resolve = {
      ...vite.resolve,
      alias: { ...(vite.resolve?.alias as Record<string, string>), "{{alias}}": resolve(import.meta.dirname, "../{{alias_target}}") },
    };
    return vite;
  },
};
export default config;
