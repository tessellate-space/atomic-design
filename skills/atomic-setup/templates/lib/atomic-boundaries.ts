// Atomic design boundary checker. Written into this repo by `atomic-design:setup`.
// It depends on nothing but Node, and it reads `.atomic-design.json`, so it keeps
// working when the plugin is not installed.
//
// Add a rule: push one entry onto RULES (id, check). The id must be a key of
// `rules` in the level map; severity and the baseline are applied for you.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

export type Severity = "error" | "warn" | "off";
export type Violation = { rule: string; file: string; detail: string };
export type LevelMap = {
  levels: Partial<Record<"atoms" | "molecules" | "organisms" | "templates", string[]>>;
  containers?: string | string[];
  dataModules: string[];
  rules?: Record<string, Severity>;
  baseline?: string;
  pages?: string | string[];
  i18n?: { scope?: "library" | "app"; attributes?: string[]; allow?: string[]; exempt?: string[] };
  tokens?: { source?: string; path?: string | string[]; grid?: number; exempt?: string[] };
};
type SourceFile = { file: string; level: string; text: string };
// `files` are the library files; `appFiles` are containers and pages (no stories or tests), read only by
// rules that opt into the whole app (i18n-no-hardcoded-strings with `i18n.scope: "app"`).
export type Context = { root: string; map: LevelMap; files: SourceFile[]; appFiles: SourceFile[] };
export type Rule = { id: string; check: (ctx: Context) => Violation[] };
export type Result = {
  errors: Violation[]; // new error-severity violations (fail the suite)
  stale: Violation[]; // baseline entries that no longer occur (fail the suite)
  warnings: Violation[]; // warn-severity violations (printed, never fail)
  baselined: Violation[]; // known debt, still present
  all: Violation[];
};

export const MAP_FILE = ".atomic-design.json";
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", "storybook-static", ".cache", "coverage"]);
const NON_COMPONENT = /\.(stories|story|test|spec|fixture)\.[jt]sx?$|\.d\.ts$/;
const SOURCE = /\.[jt]sx?$/;

export function findMapRoot(start: string): string {
  let dir = resolve(start);
  for (;;) {
    if (existsSync(join(dir, MAP_FILE))) return dir;
    const up = dirname(dir);
    if (up === dir) throw new Error(`${MAP_FILE} not found above ${start}`);
    dir = up;
  }
}

export function loadMap(root: string): LevelMap {
  return JSON.parse(readFileSync(join(root, MAP_FILE), "utf8")) as LevelMap;
}

export function globToRegExp(glob: string): RegExp {
  let out = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*" && glob[i + 1] === "*") {
      if (glob[i + 2] === "/") { out += "(?:.*/)?"; i += 2; } else { out += ".*"; i += 1; }
    } else if (c === "*") out += "[^/]*";
    else if (c === "?") out += "[^/]";
    else if (c === "{") out += "(?:";
    else if (c === "}") out += ")";
    else if (c === ",") out += glob.slice(0, i).lastIndexOf("{") > glob.slice(0, i).lastIndexOf("}") ? "|" : ",";
    else out += c.replace(/[.+^$()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${out}$`);
}

const toList = (v: string | string[] | undefined, fallback: string[]) => (v === undefined ? fallback : Array.isArray(v) ? v : [v]);
const matcher = (globs: string[]) => { const res = globs.map(globToRegExp); return (p: string) => res.some((r) => r.test(p)); };

function walk(root: string, dir = root, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(root, full, out);
    else if (SOURCE.test(name)) out.push(relative(root, full).split(sep).join("/"));
  }
  return out;
}

// Type-only imports (`import type`, `export type ... from`, `import { type A, type B }`) are erased at build
// time and carry no runtime data dependency, so `importsOf(source, false)` leaves them out.
const TYPE_ONLY = /\b(?:import|export)\s+type\b[^"';]*?\bfrom\s*["'][^"']+["']/g;
const ALL_TYPE_SPECIFIERS = /\bimport\s*\{([^}]*)\}\s*from\s*["'][^"']+["']/g;

export function importsOf(source: string, includeTypes = true): string[] {
  let text = source.replace(/\/\*[\s\S]*?\*\//g, "").split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
  if (!includeTypes) {
    text = text.replace(TYPE_ONLY, "").replace(ALL_TYPE_SPECIFIERS, (whole, list: string) => {
      const specs = list.split(",").map((x) => x.trim()).filter(Boolean);
      return specs.length > 0 && specs.every((x) => /^type\s/.test(x)) ? "" : whole;
    });
  }
  const found: string[] = [];
  const re = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)["']([^"']+)["']/g;
  for (let m = re.exec(text); m; m = re.exec(text)) found.push(m[1]);
  return found;
}

export function isDataModule(spec: string, modules: string[]): string | undefined {
  return modules.find((m) =>
    m.endsWith("*") ? spec === m.slice(0, -1).replace(/\/$/, "") || spec.startsWith(m.slice(0, -1)) : spec === m || spec.startsWith(`${m}/`));
}

const STORY_EXTS = [".stories.tsx", ".stories.ts", ".stories.jsx", ".stories.js"];
const hasStories = (root: string, file: string) => {
  const base = file.replace(/\.[jt]sx?$/, "");
  return STORY_EXTS.some((e) => existsSync(join(root, base + e)));
};

/** The text of the story file beside a component, or undefined. */
const storyTextOf = (root: string, file: string): string | undefined => {
  const base = file.replace(/\.[jt]sx?$/, "");
  const found = STORY_EXTS.map((e) => join(root, base + e)).find((p) => existsSync(p));
  return found ? readFileSync(found, "utf8") : undefined;
};

/** Top-level `key: value` pairs of the object literal after `atomic:` in a story file; undefined when there is none. */
export function readDocCard(storyText: string): Record<string, string> | undefined {
  const at = /\batomic\s*:\s*\{/.exec(storyText);
  if (!at) return undefined;
  const card: Record<string, string> = {};
  let depth = 0;
  let quote = "";
  let token = "";
  let key = "";
  for (let i = at.index + at[0].length; i < storyText.length; i++) {
    const c = storyText[i];
    if (quote) {
      token += c;
      if (c === "\\") token += storyText[++i] ?? "";
      else if (c === quote) quote = "";
    } else if (c === '"' || c === "'" || c === "`") { quote = c; token += c; }
    else if ("{[(".includes(c)) { depth++; token += c; }
    else if ("}])".includes(c)) {
      if (depth === 0) { if (key) card[key] = token.trim(); return card; }
      depth--; token += c;
    } else if (c === ":" && depth === 0 && !key) { key = token.trim().replace(/^["']|["']$/g, ""); token = ""; }
    else if (c === "," && depth === 0) { if (key) card[key] = token.trim(); key = ""; token = ""; }
    else token += c;
  }
  return card;
}

/** A card field counts when it is a non-empty string literal (or any non-literal expression). */
const filled = (v: string | undefined) => v !== undefined && !/^(["'`])\s*\1$/.test(v) && v !== "" && v !== "undefined" && v !== "null";

export const RULES: Rule[] = [
  {
    id: "data-in-containers",
    check: ({ map, files }) => files.flatMap(({ file, text }) =>
      importsOf(text, false).flatMap((spec) => (isDataModule(spec, map.dataModules) ? [{ rule: "data-in-containers", file, detail: spec }] : []))),
  },
  {
    id: "atomic-components",
    check: ({ root, map, files }) => {
      const isContainer = matcher(toList(map.containers, ["**/*-container.tsx"]));
      return files.flatMap(({ file, text }) =>
        importsOf(text).flatMap((spec) => {
          const target = (spec.startsWith(".") ? relative(root, resolve(root, dirname(file), spec)).split(sep).join("/") : spec)
            .replace(/\.[jt]sx?$/, "");
          return /-container$/.test(target) || isContainer(`${target}.tsx`)
            ? [{ rule: "atomic-components", file, detail: `imports container ${spec}` }] : [];
        }));
    },
  },
  {
    id: "stories-for-every-state",
    check: ({ root, files }) => files
      .filter(({ file }) => /\.[jt]sx$/.test(file) && !/(^|\/)index\.[jt]sx$/.test(file) && !hasStories(root, file))
      .map(({ file }) => ({ rule: "stories-for-every-state", file, detail: "no stories file" })),
  },
  {
    id: "doc-card",
    check: ({ root, files }) => files
      .filter(({ file }) => /\.[jt]sx$/.test(file) && !/(^|\/)index\.[jt]sx$/.test(file))
      .flatMap(({ file }) => {
        const story = storyTextOf(root, file);
        const card = story === undefined ? undefined : readDocCard(story);
        if (!card) return [{ rule: "doc-card", file, detail: "no doc card" }];
        return (["status", "owner"] as const)
          .filter((field) => !filled(card[field]))
          .map((field) => ({ rule: "doc-card", file, detail: `missing ${field}` }));
      }),
  },
];

// tokens-only: no colour literal and no ad-hoc font-family in a library-level file. Files that
// define the tokens (`tokens.path`) and `tokens.exempt` globs are skipped.
export function literalsOf(text: string, css: boolean): string[] {
  const code = text.replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n").map((l) => (css ? l : l.replace(/(^|[\s;,{(])\/\/.*$/, "$1"))).join("\n");
  const found = new Set<string>();
  for (const m of code.matchAll(/(?<![\w&])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])/g)) found.add(m[0].toLowerCase());
  for (const m of code.matchAll(/\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\(\s*[-+.\d][^)]*\)/gi)) found.add(m[0].replace(/\s+/g, " "));
  const families = [...code.matchAll(/font-family\s*:\s*([^;}\n]+)/gi), ...code.matchAll(/\bfontFamily\s*:\s*(["'`])(.*?)\1/g)];
  for (const m of families) {
    const value = (m[2] ?? m[1]).trim();
    if (value && !/var\(|^(?:inherit|initial|unset|revert)\b|\$\{/.test(value)) found.add(`font-family ${value.replace(/\s+/g, " ").slice(0, 60)}`);
  }
  return [...found].sort();
}

RULES.push({
  id: "tokens-only",
  check: ({ root, map, files }) => {
    const exempt = matcher([...toList(map.tokens?.path, []), ...(map.tokens?.exempt ?? [])]);
    const inLibrary = matcher(Object.values(map.levels).flatMap((g) => g ?? []));
    const isContainer = matcher(toList(map.containers, ["**/*-container.tsx"]));
    const styles = walkFiles(root, /\.css$/)
      .filter((file) => inLibrary(file) && !isContainer(file))
      .map((file) => ({ file, text: readFileSync(join(root, file), "utf8") }));
    return [...files.map(({ file, text }) => ({ file, text })), ...styles]
      .filter(({ file }) => !exempt(file))
      .flatMap(({ file, text }) => literalsOf(text, file.endsWith(".css")).map((detail) => ({ rule: "tokens-only", file, detail })));
  },
});

// i18n-no-hardcoded-strings: JSX text with a letter, and string literals given to user-facing attributes.
// A small JSX scanner, not an AST: it tracks open elements and `{}` expressions, so `{children}`, `cn(...)`
// strings, `data-*` attributes and TypeScript generics are never read as text. It does not look inside
// expressions, so text in `icon={<b>Hi</b>}` is missed; a hit it gets wrong goes in `i18n.allow` or `exempt`.
export const I18N_ATTRIBUTES = ["aria-label", "title", "placeholder", "alt"];
const UNIT = /^[\d.,]*(?:px|ms|s|em|rem|pt|vh|vw|kb|mb|gb|k|m|x)$/i;

/** True when the text has a word with a letter that is not a number with a unit (`12px`, `ms`, `3x`). */
export function hasUserText(text: string): boolean {
  return text.replace(/&#?\w+;/g, " ").split(/\s+/).some((t) => /\p{L}/u.test(t) && !UNIT.test(t));
}

function skipString(t: string, i: number): number {
  const q = t[i];
  for (i++; i < t.length; i++) {
    if (t[i] === "\\") i++;
    else if (t[i] === q) return i + 1;
    else if (q === "`" && t[i] === "$" && t[i + 1] === "{") i = skipBraces(t, i + 1) - 1;
  }
  return i;
}

/** Index just after the `}` that closes the `{` at i; strings and template literals are skipped. */
function skipBraces(t: string, i: number): number {
  let depth = 0;
  while (i < t.length) {
    const c = t[i];
    if (c === '"' || c === "'" || c === "`") i = skipString(t, i);
    else { if (c === "{") depth++; else if (c === "}" && --depth === 0) return i + 1; i++; }
  }
  return i;
}

/** The value of a lone string literal (`"a"`, `'a'`, `` `a` `` without `${`), or undefined. */
function literalOf(expr: string): string | undefined {
  const m = /^\s*(["'`])((?:\\.|(?!\1)[^\\])*)\1\s*$/s.exec(expr);
  return m && !(m[1] === "`" && m[2].includes("${")) ? m[2] : undefined;
}

type Tag = { end: number; closing: boolean; selfClosing: boolean; name: string; attrs: Array<[string, string]> };

/** Reads the tag that starts at the `<` at i; undefined when it is not one. */
function readTag(t: string, i: number, wantAttrs: Set<string>): Tag | undefined {
  let j = i + 1;
  const closing = t[j] === "/";
  if (closing) j++;
  const name = /^[A-Za-z_$][\w.$:-]*/.exec(t.slice(j))?.[0] ?? "";
  j += name.length;
  if (name !== "" && !/[\s/>]/.test(t[j] ?? "")) return undefined;
  const attrs: Array<[string, string]> = [];
  for (;;) {
    j += /^\s*/.exec(t.slice(j))![0].length;
    if (t.startsWith("/>", j)) return closing ? undefined : { end: j + 2, closing, selfClosing: true, name, attrs };
    if (t[j] === ">") return { end: j + 1, closing, selfClosing: false, name, attrs };
    if (closing || (name === "" && !t.startsWith(">", j))) return undefined;
    if (t[j] === "{") { j = skipBraces(t, j); continue; } // {...spread}
    const attr = /^[A-Za-z_$][\w:.$-]*/.exec(t.slice(j))?.[0];
    if (!attr || (attr === "extends" && !attrs.length) || (name !== "" && t[j + attr.length] === ",")) return undefined;
    j += attr.length;
    if (/^\s*=/.test(t.slice(j))) {
      j += /^\s*=\s*/.exec(t.slice(j))![0].length;
      let value: string | undefined;
      if (t[j] === '"' || t[j] === "'") { const e = skipString(t, j); value = t.slice(j + 1, e - 1); j = e; }
      else if (t[j] === "{") { const e = skipBraces(t, j); value = literalOf(t.slice(j + 1, e - 1)); j = e; }
      else return undefined;
      if (value !== undefined && wantAttrs.has(attr)) attrs.push([attr, value]);
    }
  }
}

export function stringsOf(source: string, attributes = I18N_ATTRIBUTES): Array<{ attr?: string; text: string }> {
  const t = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[\s;,{(}])\/\/.*$/gm, "$1");
  const want = new Set(attributes);
  const found: Array<{ attr?: string; text: string }> = [];
  const stack: Array<{ expr: number; trans: boolean }> = [];
  let expr = 0;
  let run: string[] = [];
  let buf = "";
  const flush = () => {
    const text = [...run, buf].join(" ").replace(/\s+/g, " ").trim();
    run = []; buf = "";
    if (text && hasUserText(text)) found.push({ text });
  };
  for (let i = 0; i < t.length;) {
    const top = stack[stack.length - 1];
    const inText = top !== undefined && expr === top.expr;
    const c = t[i];
    if (!inText && (c === '"' || c === "'" || c === "`")) { i = skipString(t, i); continue; }
    if (c === "{" && top) { run.push(buf); buf = ""; expr++; i++; continue; }
    if (c === "}" && top) { expr = Math.max(top.expr, expr - 1); i++; continue; }
    if (c === "<" && /[A-Za-z/>]/.test(t[i + 1] ?? "") && (inText || !/[\w$)\]]/.test(t[i - 1] ?? " "))) {
      const tag = readTag(t, i, want);
      if (tag) {
        if (inText) flush();
        for (const [attr, text] of tag.attrs) if (hasUserText(text)) found.push({ attr, text: text.replace(/\s+/g, " ").trim() });
        if (tag.closing) stack.pop();
        else if (!tag.selfClosing) stack.push({ expr, trans: tag.name === "Trans" || (top?.trans ?? false) });
        i = tag.end;
        continue;
      }
    }
    if (inText && !top.trans) buf += c;
    i++;
  }
  return found;
}

RULES.push({
  id: "i18n-no-hardcoded-strings",
  check: ({ map, files, appFiles }) => {
    const exempt = matcher(map.i18n?.exempt ?? []);
    const allow = new Set((map.i18n?.allow ?? []).map((a) => a.trim()));
    const scanned = map.i18n?.scope === "app" ? [...files, ...appFiles] : files;
    return scanned
      .filter(({ file }) => /\.[jt]sx$/.test(file) && !exempt(file))
      .flatMap(({ file, text }) => {
        const seen = new Set<string>();
        for (const s of stringsOf(text, map.i18n?.attributes)) {
          if (allow.has(s.text)) continue;
          seen.add(`${s.attr ? `${s.attr}: ` : ""}${s.text.slice(0, 60).trimEnd()}`);
        }
        return [...seen].map((detail) => ({ rule: "i18n-no-hardcoded-strings", file, detail }));
      });
  },
});

function walkFiles(root: string, pattern: RegExp, dir = root, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walkFiles(root, pattern, full, out);
    else if (pattern.test(name)) out.push(relative(root, full).split(sep).join("/"));
  }
  return out;
}

const key = (v: Violation) => `${v.rule}|${v.file}|${v.detail}`;

export function collect(root: string, map: LevelMap = loadMap(root)): Violation[] {
  const isContainer = matcher(toList(map.containers, ["**/*-container.tsx"]));
  const isPage = matcher(toList(map.pages, []));
  const seen = new Map<string, SourceFile>();
  const app = new Map<string, SourceFile>();
  for (const file of walk(root)) {
    if (NON_COMPONENT.test(file)) continue;
    if (isContainer(file)) { app.set(file, { file, level: "container", text: readFileSync(join(root, file), "utf8") }); continue; }
    for (const [level, globs] of Object.entries(map.levels)) {
      if (globs && matcher(globs)(file) && !seen.has(file)) seen.set(file, { file, level, text: readFileSync(join(root, file), "utf8") });
    }
    if (!seen.has(file) && isPage(file)) app.set(file, { file, level: "page", text: readFileSync(join(root, file), "utf8") });
  }
  const ctx: Context = { root, map, files: [...seen.values()], appFiles: [...app.values()] };
  return RULES.flatMap((r) => r.check(ctx)).sort((a, b) => key(a).localeCompare(key(b)));
}

export function readBaseline(root: string, map: LevelMap): Violation[] {
  const p = join(root, map.baseline ?? ".atomic-design-baseline.json");
  return existsSync(p) ? (JSON.parse(readFileSync(p, "utf8")) as Violation[]) : [];
}

export function checkAtomicLibrary(root: string, map: LevelMap = loadMap(root)): Result {
  const sev = (id: string): Severity => (id === "data-in-containers" ? "error" : map.rules?.[id] ?? "error");
  const all = collect(root, map).filter((v) => sev(v.rule) !== "off");
  const errorRules = all.filter((v) => sev(v.rule) === "error");
  const warnings = all.filter((v) => sev(v.rule) === "warn");
  const baseline = readBaseline(root, map).filter((b) => sev(b.rule) === "error");
  const known = new Set(baseline.map(key));
  const present = new Set(errorRules.map(key));
  return {
    all,
    warnings,
    errors: errorRules.filter((v) => !known.has(key(v))),
    baselined: errorRules.filter((v) => known.has(key(v))),
    stale: baseline.filter((b) => !present.has(key(b))),
  };
}

/** Lines for `expect(report(result)).toEqual([])`. Warnings are not included; print them with `warningsText`. */
export function report(r: Result): string[] {
  return [
    ...r.errors.map((v) => `${v.rule}: ${v.file} ${v.detail}`),
    ...r.stale.map((v) => `remove this entry from the baseline: fixed - ${v.rule}: ${v.file} ${v.detail}`),
  ];
}

export function warningsText(r: Result): string {
  return r.warnings.length ? `atomic-design warnings (${r.warnings.length}, not failing):\n${r.warnings.map((v) => `  ${v.rule}: ${v.file} ${v.detail}`).join("\n")}` : "";
}

/** Writes the baseline once, from the current violations. Never overwrites: the list may only shrink. */
export function initBaseline(root: string, map: LevelMap = loadMap(root), onlyRule?: string): number {
  const p = join(root, map.baseline ?? ".atomic-design-baseline.json");
  const sev = (id: string): Severity => (id === "data-in-containers" ? "error" : map.rules?.[id] ?? "error");
  const entries = collect(root, map).filter((v) => sev(v.rule) === "error" && (onlyRule === undefined || v.rule === onlyRule));
  if (onlyRule !== undefined && existsSync(p)) {
    // A rule added after setup (for example tokens-only) may record its existing debt once.
    const current = readBaseline(root, map);
    if (current.some((b) => b.rule === onlyRule)) throw new Error(`${p} already has ${onlyRule} entries; remove fixed entries by hand, never regenerate`);
    writeFileSync(p, `${JSON.stringify([...current, ...entries].sort((a, b) => key(a).localeCompare(key(b))), null, 2)}\n`);
    return entries.length;
  }
  if (existsSync(p)) throw new Error(`${p} exists; remove fixed entries by hand, never regenerate`);
  writeFileSync(p, `${JSON.stringify(entries, null, 2)}\n`);
  return entries.length;
}
