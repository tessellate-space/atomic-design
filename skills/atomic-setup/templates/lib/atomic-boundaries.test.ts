// atomic:runner-import afterAll,describe,expect,it
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { checkAtomicLibrary, globToRegExp, importsOf, initBaseline, report, type LevelMap } from "./atomic-boundaries";

// Fixture tests for the checker. Each one fails if the checker is wrong.
const dirs: string[] = [];
afterAll(() => dirs.forEach((d) => rmSync(d, { recursive: true, force: true })));

function repo(files: Record<string, string>, map: Partial<LevelMap> = {}, baseline?: unknown) {
  const root = mkdtempSync(join(tmpdir(), "atomic-"));
  dirs.push(root);
  const full: LevelMap = {
    levels: { atoms: ["src/ui/**"], molecules: ["src/molecules/**"], organisms: ["src/organisms/**"], templates: ["src/templates/**"] },
    dataModules: ["@tanstack/react-query", "@/lib/api", "@/data/*"],
    ...map,
    // The doc-card rule has its own tests below; every other test starts with it off.
    rules: { "doc-card": "off", ...map.rules },
  };
  const all: Record<string, string> = { ".atomic-design.json": JSON.stringify(full), ...files };
  if (baseline) all[".atomic-design-baseline.json"] = JSON.stringify(baseline);
  for (const [p, text] of Object.entries(all)) {
    mkdirSync(dirname(join(root, p)), { recursive: true });
    writeFileSync(join(root, p), text);
  }
  return { root, map: full };
}
const clean = `export const A = () => null;\n`;
const withStories = (path: string, text = clean) => ({ [path]: text, [path.replace(/\.tsx$/, ".stories.tsx")]: "export default {};\n" });

describe("checker", () => {
  it("passes a clean component", () => {
    const r = repo(withStories("src/molecules/a.tsx"));
    expect(report(checkAtomicLibrary(r.root))).toEqual([]);
  });

  it.each(["@tanstack/react-query", "@/lib/api", "@/data/orders"])("flags %s with file and import", (spec) => {
    const r = repo(withStories("src/molecules/a.tsx", `import x from "${spec}";\n${clean}`));
    expect(report(checkAtomicLibrary(r.root))).toEqual([`data-in-containers: src/molecules/a.tsx ${spec}`]);
  });

  it("flags a dynamic import and a require", () => {
    const r = repo(withStories("src/ui/a.tsx", `const q = () => import("@tanstack/react-query");\nconst b = require("@/lib/api");\n${clean}`));
    expect(report(checkAtomicLibrary(r.root))).toHaveLength(2);
  });

  it("does not flag a comment that mentions a data module", () => {
    const r = repo(withStories("src/ui/a.tsx", `// import x from "@/lib/api"\n${clean}`));
    expect(report(checkAtomicLibrary(r.root))).toEqual([]);
  });

  it.each(["ui", "molecules", "organisms", "templates"])("checks the %s level", (dir) => {
    const r = repo(withStories(`src/${dir}/a.tsx`, `import x from "@/lib/api";\n${clean}`));
    expect(checkAtomicLibrary(r.root).errors).toHaveLength(1);
  });

  it("flags a component without stories, but not stories or tests", () => {
    const r = repo({
      "src/ui/a.tsx": clean,
      "src/ui/b.stories.tsx": "export default {};\n",
      "src/ui/b.test.tsx": "",
      "src/ui/index.ts": "",
    });
    expect(report(checkAtomicLibrary(r.root))).toEqual(["stories-for-every-state: src/ui/a.tsx no stories file"]);
  });

  it("lets a container fetch, and flags a library file that imports one", () => {
    const r = repo({
      "src/features/x/x-container.tsx": `import q from "@tanstack/react-query";\n${clean}`,
      ...withStories("src/molecules/a.tsx", `import { X } from "../../features/x/x-container";\n${clean}`),
    }, { levels: { molecules: ["src/molecules/**"], atoms: ["src/features/**"] } });
    expect(report(checkAtomicLibrary(r.root))).toEqual(["atomic-components: src/molecules/a.tsx imports container ../../features/x/x-container"]);
  });

  it("matches globs", () => {
    expect(globToRegExp("src/features/*/ui/**").test("src/features/users/ui/a/b.tsx")).toBe(true);
    expect(globToRegExp("**/*-container.tsx").test("a-container.tsx")).toBe(true);
    expect(globToRegExp("src/{a,b}/**").test("src/b/x.tsx")).toBe(true);
    expect(globToRegExp("src/*/x.tsx").test("src/a/b/x.tsx")).toBe(false);
  });

  it("does not count type-only imports as data imports", () => {
    const typeOnly = [
      `import type { Order } from "@/lib/api";`,
      `import type Order from "@/lib/api";`,
      `import type * as Api from "@/lib/api";`,
      `import { type Order, type Customer } from "@/lib/api";`,
      `export type { Order } from "@/lib/api";`,
      `import type {\n  Order,\n} from "@/lib/api";`,
    ];
    for (const line of typeOnly) {
      const r = repo(withStories("src/molecules/a.tsx", `${line}\n${clean}`));
      expect({ line, found: report(checkAtomicLibrary(r.root)) }).toEqual({ line, found: [] }); // Jest's expect takes one argument
    }
  });

  it("still counts a mixed import and a value import beside a type import", () => {
    const mixed = repo(withStories("src/molecules/a.tsx", `import { type Order, fetchOrders } from "@/lib/api";\n${clean}`));
    expect(report(checkAtomicLibrary(mixed.root))).toEqual(["data-in-containers: src/molecules/a.tsx @/lib/api"]);
    const both = repo(withStories("src/molecules/a.tsx", `import type { Order } from "@/lib/api";\nimport { fetchOrders } from "@/lib/api";\n${clean}`));
    expect(report(checkAtomicLibrary(both.root))).toEqual(["data-in-containers: src/molecules/a.tsx @/lib/api"]);
  });

  it("reads imports of every form", () => {
    expect(importsOf(`import a from "x"; import "y"; export * from "z"; const w = import("v"); require("u")`).sort()).toEqual(["u", "v", "x", "y", "z"]);
  });
});

describe("severities", () => {
  const bad = { ...withStories("src/ui/a.tsx", `import x from "@/lib/api";\n${clean}`), "src/ui/b.tsx": clean };
  it("error fails, warn is listed without failing, off skips", () => {
    const r = repo(bad, { rules: { "stories-for-every-state": "error" } });
    expect(checkAtomicLibrary(r.root).errors.map((v) => v.rule).sort()).toEqual(["data-in-containers", "stories-for-every-state"]);
    const w = repo(bad, { rules: { "stories-for-every-state": "warn" } });
    const rw = checkAtomicLibrary(w.root);
    expect(rw.errors.map((v) => v.rule)).toEqual(["data-in-containers"]);
    expect(rw.warnings.map((v) => v.file)).toEqual(["src/ui/b.tsx"]);
    const o = repo(bad, { rules: { "stories-for-every-state": "off" } });
    const ro = checkAtomicLibrary(o.root);
    expect(ro.warnings).toEqual([]);
    expect(ro.errors.map((v) => v.rule)).toEqual(["data-in-containers"]);
  });
  it("data-in-containers cannot be turned off", () => {
    const r = repo(bad, { rules: { "data-in-containers": "off" } });
    expect(checkAtomicLibrary(r.root).errors.map((v) => v.rule)).toContain("data-in-containers");
  });
});

describe("baseline", () => {
  const debt = { rule: "data-in-containers", file: "src/ui/a.tsx", detail: "@/lib/api" };
  const files = withStories("src/ui/a.tsx", `import x from "@/lib/api";\n${clean}`);
  it("known violations pass", () => {
    const r = repo(files, {}, [debt]);
    expect(report(checkAtomicLibrary(r.root))).toEqual([]);
  });
  it("a new violation fails on that file only", () => {
    const r = repo({ ...files, ...withStories("src/ui/c.tsx", `import x from "@/lib/api";\n${clean}`) }, {}, [debt]);
    expect(report(checkAtomicLibrary(r.root))).toEqual(["data-in-containers: src/ui/c.tsx @/lib/api"]);
  });
  it("a fixed violation fails until its entry is removed", () => {
    const r = repo(withStories("src/ui/a.tsx"), {}, [debt]);
    expect(report(checkAtomicLibrary(r.root))).toEqual(["remove this entry from the baseline: fixed - data-in-containers: src/ui/a.tsx @/lib/api"]);
  });
  it("ignores entries of rules that are warn or off", () => {
    const r = repo(withStories("src/ui/a.tsx"), { rules: { "stories-for-every-state": "warn" } }, [{ rule: "stories-for-every-state", file: "src/ui/zz.tsx", detail: "no stories file" }]);
    expect(report(checkAtomicLibrary(r.root))).toEqual([]);
  });
  it("initBaseline writes once and never overwrites", () => {
    const r = repo(files);
    expect(initBaseline(r.root)).toBe(1);
    expect(report(checkAtomicLibrary(r.root))).toEqual([]);
    expect(() => initBaseline(r.root)).toThrow(/never regenerate/);
  });
});

describe("doc-card", () => {
  const card = (fields: string) => `export default { title: "Molecules/A", parameters: { atomic: { ${fields} } } };\n`;
  const withCard = (fields: string) => ({ "src/molecules/a.tsx": clean, "src/molecules/a.stories.tsx": card(fields) });
  const on = { rules: { "doc-card": "error" } } as const;
  const only = (r: ReturnType<typeof repo>) => report(checkAtomicLibrary(r.root)).filter((l) => l.startsWith("doc-card"));

  it("passes a card with status and owner", () => {
    expect(only(repo(withCard(`status: "experimental", owner: "Web team", dos: ["a, b"]`), on))).toEqual([]);
  });
  it("flags a missing status", () => {
    expect(only(repo(withCard(`owner: "Web team"`), on))).toEqual(["doc-card: src/molecules/a.tsx missing status"]);
  });
  it("flags a missing or empty owner", () => {
    expect(only(repo(withCard(`status: "stable"`), on))).toEqual(["doc-card: src/molecules/a.tsx missing owner"]);
    expect(only(repo(withCard(`status: "stable", owner: ""`), on))).toEqual(["doc-card: src/molecules/a.tsx missing owner"]);
  });
  it("does not read a field that only appears inside a nested value", () => {
    expect(only(repo(withCard(`status: "stable", dos: ["owner: Web team"]`), on))).toEqual(["doc-card: src/molecules/a.tsx missing owner"]);
  });
  it("flags a component with stories but no card, and one with no stories", () => {
    const r = repo({ "src/molecules/a.tsx": clean, "src/molecules/a.stories.tsx": "export default {};\n", "src/ui/b.tsx": clean }, on);
    expect(only(r)).toEqual(["doc-card: src/molecules/a.tsx no doc card", "doc-card: src/ui/b.tsx no doc card"]);
  });
  it("warn lists it without failing, and the baseline holds known gaps", () => {
    const files = { "src/molecules/a.tsx": clean, "src/molecules/a.stories.tsx": "export default {};\n" };
    const w = checkAtomicLibrary(repo(files, { rules: { "doc-card": "warn" } }).root);
    expect(w.errors).toEqual([]);
    expect(w.warnings.map((v) => v.rule)).toEqual(["doc-card"]);
    const b = repo(files, on, [{ rule: "doc-card", file: "src/molecules/a.tsx", detail: "no doc card" }]);
    expect(only(b)).toEqual([]);
  });
});

describe("tokens-only", () => {
  const tok = (r: ReturnType<typeof repo>) => checkAtomicLibrary(r.root).errors.filter((v) => v.rule === "tokens-only").map((v) => `${v.file} ${v.detail}`);
  const comp = (body: string) => `export const A = () => <div style={{ ${body} }} />;\n`;

  it("flags a hex in a molecule, naming file and literal", () => {
    const r = repo(withStories("src/molecules/a.tsx", comp(`color: "#FF0000"`)));
    expect(tok(r)).toEqual(["src/molecules/a.tsx #ff0000"]);
  });

  it.each(["#fff", "#ffff", "#ff000080", "rgb(255, 0, 0)", "rgba(0,0,0,.5)", "hsl(10 50% 50%)", "oklch(0.6 0.2 30)"])("flags %s", (lit) => {
    const r = repo(withStories("src/organisms/a.tsx", comp(`color: "${lit}"`)));
    expect(tok(r)).toHaveLength(1);
  });

  it("flags an ad-hoc font-family in ts and css, not a token reference", () => {
    const r = repo({
      ...withStories("src/ui/a.tsx", comp(`fontFamily: "Comic Sans MS, cursive"`)),
      "src/ui/b.module.css": ".b { font-family: Arial, sans-serif; }\n",
      "src/ui/c.module.css": ".c { font-family: var(--font-sans); color: var(--color-ink); }\n",
    });
    expect(tok(r)).toEqual(["src/ui/a.tsx font-family Comic Sans MS, cursive", "src/ui/b.module.css font-family Arial, sans-serif"]);
  });

  it("reads css files under a library level", () => {
    const r = repo({ ...withStories("src/molecules/a.tsx"), "src/molecules/a.css": ".a { color: #123456; background: rgb(1 2 3); }\n" });
    expect(tok(r)).toEqual(["src/molecules/a.css #123456", "src/molecules/a.css rgb(1 2 3)"]);
  });

  it("does not flag tokens, comments, hex-like words, tests or stories", () => {
    const r = repo({
      ...withStories("src/ui/a.tsx", `// #ff0000 was the old red\n/* rgb(1,2,3) */\nexport const A = () => <a href="#section" style={{ color: "var(--color-ink)", background: "rgb(var(--x) / 50%)" }}>&#8212;</a>;\n`),
      "src/ui/a.test.tsx": comp(`color: "#ff0000"`),
      "src/ui/zz.stories.tsx": comp(`color: "#ff0000"`),
    });
    expect(tok(r)).toEqual([]);
  });

  it("skips the token source and exempt globs, and files outside the levels", () => {
    const files = {
      ...withStories("src/ui/theme.tsx", comp(`color: "#111111"`)),
      ...withStories("src/ui/icons/logo.tsx", comp(`fill: "#222222"`)),
      "src/other/page.tsx": comp(`color: "#333333"`),
    };
    expect(tok(repo(files))).toEqual(["src/ui/icons/logo.tsx #222222", "src/ui/theme.tsx #111111"]);
    expect(tok(repo(files, { tokens: { path: "src/ui/theme.tsx", exempt: ["**/icons/**"] } }))).toEqual([]);
  });

  it("is held by the baseline, can be warn or off, and a new literal still fails", () => {
    const files = withStories("src/molecules/a.tsx", comp(`color: "#ff0000"`));
    const known = [{ rule: "tokens-only", file: "src/molecules/a.tsx", detail: "#ff0000" }];
    expect(report(checkAtomicLibrary(repo(files, {}, known).root))).toEqual([]);
    const more = withStories("src/molecules/a.tsx", comp(`color: "#ff0000", background: "#00ff00"`));
    expect(report(checkAtomicLibrary(repo(more, {}, known).root))).toEqual(["tokens-only: src/molecules/a.tsx #00ff00"]);
    expect(checkAtomicLibrary(repo(files, { rules: { "tokens-only": "warn" } }).root).warnings).toHaveLength(1);
    expect(checkAtomicLibrary(repo(files, { rules: { "tokens-only": "off" } }).root).all).toEqual([]);
  });
  it("a rule added after setup records its existing debt once, without touching other entries", () => {
    const old = { rule: "data-in-containers", file: "src/ui/a.tsx", detail: "@/lib/api" };
    const files = { ...withStories("src/ui/a.tsx", `import x from "@/lib/api";\n${comp(`color: "#ff0000"`)}`) };
    const r = repo(files, {}, [old]);
    expect(report(checkAtomicLibrary(r.root))).toEqual(["tokens-only: src/ui/a.tsx #ff0000"]);
    expect(initBaseline(r.root, undefined, "tokens-only")).toBe(1);
    expect(report(checkAtomicLibrary(r.root))).toEqual([]);
    expect(() => initBaseline(r.root, undefined, "tokens-only")).toThrow(/never regenerate/);
  });
});

describe("i18n-no-hardcoded-strings", () => {
  const body = (jsx: string) => `export const A = () => (\n  ${jsx}\n);\n`;
  const hits = (r: ReturnType<typeof repo>) => checkAtomicLibrary(r.root).errors.filter((v) => v.rule === "i18n-no-hardcoded-strings").map((v) => `${v.file} ${v.detail}`);
  const one = (jsx: string, map: Partial<LevelMap> = {}) => hits(repo(withStories("src/ui/a.tsx", body(jsx)), map));

  it("flags JSX text in an atom, naming file and text", () => {
    const r = repo(withStories("src/ui/a.tsx", body("<button>Close</button>")));
    expect(report(checkAtomicLibrary(r.root))).toEqual(["i18n-no-hardcoded-strings: src/ui/a.tsx Close"]);
  });

  it("flags an attribute literal in every spelling, prefixed by the attribute", () => {
    expect(one(`<button aria-label="Close menu">x</button>`)).toEqual(["src/ui/a.tsx aria-label: Close menu"]);
    expect(one(`<input placeholder='Search' />`)).toEqual(["src/ui/a.tsx placeholder: Search"]);
    expect(one(`<img alt={"Logo"} />`)).toEqual(["src/ui/a.tsx alt: Logo"]);
    expect(one("<a title={`Home`}>.</a>")).toEqual(["src/ui/a.tsx title: Home"]);
  });

  it("flags the shadcn sr-only label", () => {
    expect(one(`<button><X /><span className="sr-only">Close</span></button>`)).toEqual(["src/ui/a.tsx Close"]);
  });

  it("does not flag translated or non-text content", () => {
    expect(one(`<p>{t("close")}</p>`)).toEqual([]);
    expect(one(`<Trans>Hello <b>there</b></Trans>`)).toEqual([]);
    expect(one(`<Trans i18nKey="a">Hello</Trans>`)).toEqual([]);
    expect(one(`<p>42%</p>`)).toEqual([]);
    expect(one(`<p> · </p>`)).toEqual([]);
    expect(one(`<p>12px 300ms ×</p>`)).toEqual([]);
    expect(one(`<p>&nbsp;&times;</p>`)).toEqual([]);
    expect(one(`<p aria-label={t("x")} title={label} alt="" />`)).toEqual([]);
  });

  it("does not flag shadcn plumbing: children, props, cn(), className, data-*", () => {
    const jsx = `<div className={cn("flex items-center gap-2", className)} data-slot="sheet-content" data-state="open" className2="Not an attr">
    {children}
    {props.label}
    {...props}
  </div>`;
    expect(one(jsx)).toEqual([]);
    expect(one(`<div className="flex items-center" role="dialog" id="main">{props.label}</div>`)).toEqual([]);
  });

  it("finds text next to expressions and inside nested elements", () => {
    expect(one(`<p>Hello {name}, welcome</p>`)).toEqual(["src/ui/a.tsx Hello , welcome"]);
    expect(one(`<ul>{items.map((i) => <li key={i}>Item</li>)}</ul>`)).toEqual(["src/ui/a.tsx Item"]);
    expect(one(`<div>{ok && <b>Yes</b>}{n > 0 ? <i>Many</i> : null}</div>`)).toEqual(["src/ui/a.tsx Many", "src/ui/a.tsx Yes"]);
  });

  it("does not read a generic, an arrow function or a comparison as JSX text", () => {
    const code = `import { useState } from "react";
const xs: Array<string> = [];
const [v, setV] = useState<Map<string, number>>(new Map());
const f = (a: number, b: number) => a < b && b > a ? "less" : "more";
const g = <T,>(x: T) => x;
const h = async (n: number): Promise<Array<string>> => { if (n <5) return []; return xs; };
export const A = () => <span>{String(f(1, 2))}</span>;
`;
    expect(hits(repo(withStories("src/ui/a.tsx", code)))).toEqual([]);
  });

  it("does not read comments or strings in code as text", () => {
    const code = `// <p>Hello</p>\n/* <p>World</p> */\nconst s = "<p>Text</p>";\nexport const A = () => <div>{/* Note */}{s}</div>;\n`;
    expect(hits(repo(withStories("src/ui/a.tsx", code)))).toEqual([]);
  });

  it("honours allow, attributes and exempt", () => {
    expect(one(`<b>Acme</b>`, { i18n: { allow: ["Acme"] } })).toEqual([]);
    expect(one(`<b aria-label="Acme">.</b>`, { i18n: { allow: ["Acme"] } })).toEqual([]);
    expect(one(`<a title="Home" aria-label="Menu">.</a>`, { i18n: { attributes: ["title"] } })).toEqual(["src/ui/a.tsx title: Home"]);
    expect(one(`<b>Hi</b>`, { i18n: { exempt: ["src/ui/**"] } })).toEqual([]);
  });

  it("caps the detail at 60 characters and collapses whitespace", () => {
    expect(one(`<p>\n    ${"word ".repeat(20)}\n  </p>`)).toEqual([`src/ui/a.tsx ${"word ".repeat(12).trim()}`]);
  });

  it("skips stories and tests", () => {
    const r = repo({ ...withStories("src/ui/a.tsx"), "src/ui/a.stories.tsx": body("<b>Story text</b>"), "src/ui/a.test.tsx": body("<b>Test text</b>") });
    expect(hits(r)).toEqual([]);
  });

  describe("scope", () => {
    const files = { ...withStories("src/ui/a.tsx"), "src/features/orders-container.tsx": body(`<nav aria-label="Language" />`), "src/pages/home.tsx": body("<h1>Home</h1>") };
    it("library (the default) leaves containers and pages alone", () => {
      expect(hits(repo(files, { pages: "src/pages/**" }))).toEqual([]);
    });
    it("app also checks containers and pages", () => {
      expect(hits(repo(files, { pages: "src/pages/**", i18n: { scope: "app" } }))).toEqual([
        "src/features/orders-container.tsx aria-label: Language",
        "src/pages/home.tsx Home",
      ]);
    });
    it("app still skips the other rules' library-only behaviour", () => {
      const r = repo(files, { pages: "src/pages/**", i18n: { scope: "app" }, rules: { "i18n-no-hardcoded-strings": "off" } });
      expect(checkAtomicLibrary(r.root).all).toEqual([]);
    });
  });

  it("warn lists it without failing, off skips it", () => {
    const files = withStories("src/ui/a.tsx", body("<b>Hi</b>"));
    const warn = checkAtomicLibrary(repo(files, { rules: { "i18n-no-hardcoded-strings": "warn" } }).root);
    expect(warn.warnings).toHaveLength(1);
    expect(report(warn)).toEqual([]);
    expect(checkAtomicLibrary(repo(files, { rules: { "i18n-no-hardcoded-strings": "off" } }).root).all).toEqual([]);
  });

  it("is held by the baseline; a fixed hit fails as stale; initBaseline records the debt once", () => {
    const files = withStories("src/ui/a.tsx", body("<b>Hi</b>"));
    const known = [{ rule: "i18n-no-hardcoded-strings", file: "src/ui/a.tsx", detail: "Hi" }];
    expect(report(checkAtomicLibrary(repo(files, {}, known).root))).toEqual([]);
    const fixed = withStories("src/ui/a.tsx", body("<b>{t(\"hi\")}</b>"));
    expect(report(checkAtomicLibrary(repo(fixed, {}, known).root))).toEqual(["remove this entry from the baseline: fixed - i18n-no-hardcoded-strings: src/ui/a.tsx Hi"]);
    const r = repo(files, {}, []);
    expect(initBaseline(r.root, undefined, "i18n-no-hardcoded-strings")).toBe(1);
    expect(report(checkAtomicLibrary(r.root))).toEqual([]);
  });
});
