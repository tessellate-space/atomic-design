// @vitest-environment node
// atomic:runner-import expect,it
import { resolve } from "node:path";
import { loadConfigFromFile, mergeConfig, type InlineConfig } from "vite";
import main from "{{storybook_main_import}}";

// Resolves the Storybook config the way the builder does in dev and asserts every
// plugin appears exactly once. A double React refresh passes `storybook build`
// and kills the dev preview, so only this test catches it. It never starts a server.
it("loads each build plugin exactly once in dev", async () => {
  const root = resolve(__dirname, "{{root_from_tests}}");
  const loaded = await loadConfigFromFile({ command: "serve", mode: "development" }, resolve(root, "{{vite_config}}"));
  const merged = mergeConfig({ root, configFile: false, plugins: [] }, loaded!.config) as InlineConfig;
  const final = (await main.viteFinal!(merged as never, { configType: "DEVELOPMENT" } as never)) as InlineConfig;
  const names = (final.plugins ?? []).flat(Infinity as 1).map((p) => (p as { name?: string } | null)?.name).filter(Boolean);
  for (const n of {{guarded_plugins_json}}) {
    expect(names.filter((x) => x === n)).toHaveLength(1);
  }
});
