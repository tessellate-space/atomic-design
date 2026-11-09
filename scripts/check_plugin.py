#!/usr/bin/env python3
"""Lint for the atomic-design plugin. Standard library only.

Usage:
  python3 scripts/check_plugin.py [PLUGIN_DIR] [--denylist FILE]
  python3 scripts/check_plugin.py --self-test
  python3 scripts/check_plugin.py --validate-map PATH/.atomic-design.json

Fails (exit 1) on:
  - invalid manifest or marketplace JSON
  - skill frontmatter without name or description, or a name that differs from its folder
  - a reference or template that no SKILL.md or reference mentions
  - a template placeholder missing from the setup facts
  - a level map (.atomic-design.json under fixtures/) that fails the schema
  - any denylisted term in a plugin file (word-boundary, case-insensitive)

No denylist ships with the plugin: keep yours outside it and pass it with
--denylist (default: .private-denylist.txt next to the plugin folder). One term per
line; a line starting with "!" is an exact phrase that stays allowed. Without a
denylist the check is skipped with a notice.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
import tempfile
from pathlib import Path

SKIP_DIRS = {"node_modules", ".git", "dist", "storybook-static", ".cache"}
TEXT_SUFFIXES = {
    ".md", ".json", ".py", ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".css", ".html",
    ".txt", ".yml", ".yaml", ".toml", ".svg", ".cts", ".mts", "", ".gitignore", ".lock",
}
PLACEHOLDER = re.compile(r"\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}")


def walk(root: Path):
    for p in sorted(root.rglob("*")):
        if any(part in SKIP_DIRS for part in p.relative_to(root).parts):
            continue
        if p.is_file():
            yield p


def read_json(path: Path, errors: list[str], label: str):
    try:
        return json.loads(path.read_text())
    except FileNotFoundError:
        errors.append(f"{label}: missing {path}")
    except json.JSONDecodeError as e:
        errors.append(f"{label}: invalid JSON in {path}: {e}")
    return None


# ---------------------------------------------------------------- schema

def _type_ok(value, t) -> bool:
    types = t if isinstance(t, list) else [t]
    for x in types:
        if x == "string" and isinstance(value, str):
            return True
        if x == "integer" and isinstance(value, int) and not isinstance(value, bool):
            return True
        if x == "boolean" and isinstance(value, bool):
            return True
        if x == "array" and isinstance(value, list):
            return True
        if x == "object" and isinstance(value, dict):
            return True
    return False


def validate(value, schema: dict, root: dict, path: str, out: list[str]) -> None:
    """Minimal JSON Schema subset: $ref, type, enum, const, required, properties,
    additionalProperties, items, minLength, minimum, if/then. Errors name the field."""
    if "$ref" in schema:
        node = root
        for part in schema["$ref"].lstrip("#/").split("/"):
            node = node[part]
        validate(value, node, root, path, out)
    where = path or "(root)"
    if "type" in schema and not _type_ok(value, schema["type"]):
        out.append(f"{where}: expected {schema['type']}")
        return
    if "enum" in schema and value not in schema["enum"]:
        out.append(f"{where}: {schema['x-error']}" if schema.get("x-error") else f"{where}: must be one of {schema['enum']}")
    if "const" in schema and value != schema["const"]:
        out.append(f"{where}: must be {schema['const']!r}")
    if isinstance(value, str) and "minLength" in schema and len(value) < schema["minLength"]:
        out.append(f"{where}: must not be empty")
    if isinstance(value, int) and not isinstance(value, bool) and "minimum" in schema and value < schema["minimum"]:
        out.append(f"{where}: must be >= {schema['minimum']}")
    if isinstance(value, list) and "items" in schema:
        for i, item in enumerate(value):
            validate(item, schema["items"], root, f"{path}[{i}]", out)
    if isinstance(value, dict):
        props = schema.get("properties", {})
        for req in schema.get("required", []):
            if req not in value:
                out.append(f"{where}: missing required field '{req}'")
        for key, sub in value.items():
            child = f"{path}.{key}" if path else key
            if key in props:
                validate(sub, props[key], root, child, out)
            else:
                ap = schema.get("additionalProperties", True)
                if ap is False:
                    out.append(f"{child}: unknown field")
                elif isinstance(ap, dict):
                    validate(sub, ap, root, child, out)
        if "if" in schema and "then" in schema:
            probe: list[str] = []
            validate(value, schema["if"], root, path, probe)
            if not probe:
                before = len(out)
                validate(value, schema["then"], root, path, out)
                if len(out) > before and schema["then"].get("x-error"):
                    out[before:] = [f"{where}: {schema['then']['x-error']}"]


def validate_map(data, schema: dict) -> list[str]:
    out: list[str] = []
    validate(data, schema, schema, "", out)
    return out


# ---------------------------------------------------------------- checks

def check_manifest(plugin: Path, errors: list[str]) -> None:
    m = read_json(plugin / ".claude-plugin" / "plugin.json", errors, "manifest")
    if isinstance(m, dict):
        for k in ("name", "version", "description", "license"):
            if not isinstance(m.get(k), str) or not m[k].strip():
                errors.append(f"manifest: plugin.json needs a non-empty '{k}'")
        author = m.get("author")
        if isinstance(author, dict) and "email" in author:
            errors.append("manifest: plugin.json author must not carry an email")
    # The marketplace sits beside plugin.json (plugin at the repo root, source "./") or one level up.
    beside = plugin / ".claude-plugin" / "marketplace.json"
    mk = beside if beside.exists() else plugin.parent / ".claude-plugin" / "marketplace.json"
    if mk.exists():
        d = read_json(mk, errors, "marketplace")
        if isinstance(d, dict):
            plugins = d.get("plugins")
            if not isinstance(d.get("name"), str) or not isinstance(plugins, list) or not plugins:
                errors.append("marketplace: needs 'name' and a non-empty 'plugins' list")
            else:
                for entry in plugins:
                    src = entry.get("source") if isinstance(entry, dict) else None
                    if not isinstance(src, str) or not src.startswith("./"):
                        errors.append(f"marketplace: plugin {entry.get('name') if isinstance(entry, dict) else entry!r} needs a relative './' source")
                        continue
                    target = (mk.parent.parent / src).resolve()
                    if not (target / ".claude-plugin" / "plugin.json").exists():
                        errors.append(f"marketplace: source {src} has no .claude-plugin/plugin.json")
    if not (plugin / "LICENSE").exists():
        errors.append("manifest: LICENSE is missing")


def parse_frontmatter(text: str) -> dict[str, str] | None:
    m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    if not m:
        return None
    fm: dict[str, str] = {}
    for line in m.group(1).splitlines():
        kv = re.match(r"^([A-Za-z0-9_-]+):\s*(.*)$", line)
        if kv:
            fm[kv.group(1)] = kv.group(2).strip().strip("\"'")
    return fm


def check_skills(plugin: Path, errors: list[str]) -> None:
    skills = plugin / "skills"
    if not skills.is_dir():
        errors.append("skills: skills/ is missing")
        return
    texts: dict[Path, str] = {}
    for d in sorted(p for p in skills.iterdir() if p.is_dir()):
        sk = d / "SKILL.md"
        if not sk.exists():
            errors.append(f"skills: {d.name}/SKILL.md is missing")
            continue
        fm = parse_frontmatter(sk.read_text())
        rel = sk.relative_to(plugin)
        if fm is None:
            errors.append(f"skills: {rel} has no frontmatter")
        else:
            if not fm.get("name"):
                errors.append(f"skills: {rel} frontmatter lacks name")
            elif fm["name"] != d.name:
                errors.append(f"skills: {rel} name '{fm['name']}' does not match folder '{d.name}'")
            if not fm.get("description"):
                errors.append(f"skills: {rel} frontmatter lacks description")
        for p in walk(d):
            if p.suffix == ".md":
                texts[p] = p.read_text()
    # references / templates must be mentioned somewhere else in the skills
    for d in sorted(p for p in skills.iterdir() if p.is_dir()):
        for sub in ("references", "templates"):
            for f in walk(d / sub) if (d / sub).is_dir() else []:
                others = [t for p, t in texts.items() if p != f]
                if not any(f.name in t or str(f.relative_to(d)) in t for t in others):
                    errors.append(f"references: {f.relative_to(plugin)} is not mentioned by any SKILL.md or reference")


def check_placeholders(plugin: Path, errors: list[str]) -> None:
    """Every {{placeholder}} in a template must appear in the setup facts
    (skills/atomic-setup/references/facts.md, written by change 2)."""
    templates = [f for d in (plugin / "skills").glob("*/templates") for f in walk(d)]
    if not templates:
        return
    facts = plugin / "skills" / "atomic-setup" / "references" / "facts.md"
    known = set(PLACEHOLDER.findall(facts.read_text())) if facts.exists() else set()
    for f in templates:
        if f.suffix and f.suffix not in TEXT_SUFFIXES and f.suffix not in {".tmpl", ".hbs"}:
            continue
        for n, line in enumerate(f.read_text(errors="ignore").splitlines(), 1):
            for name in PLACEHOLDER.findall(line):
                if name not in known:
                    errors.append(f"placeholders: {f.relative_to(plugin)}:{n} uses {{{{{name}}}}} which is not in the setup facts")


def check_level_maps(plugin: Path, errors: list[str]) -> None:
    schema_path = plugin / "schema" / "atomic-design.schema.json"
    schema = read_json(schema_path, errors, "schema")
    if schema is None:
        return
    fixtures = plugin / "fixtures"
    if not fixtures.is_dir():
        return
    for f in walk(fixtures):
        if f.name == ".atomic-design.json":
            data = read_json(f, errors, "level map")
            if data is None:
                continue
            for msg in validate_map(data, schema):
                errors.append(f"level map: {f.relative_to(plugin)}: {msg}")


def load_denylist(path: Path | None) -> list[str]:
    """Terms to block, one per line. A line starting with "!" is an allowed phrase instead: it is
    removed before matching, so "!acme-org" permits "acme-org" while "acme" stays blocked."""
    if path is None or not path.exists():
        return []
    return [ln.strip() for ln in path.read_text().splitlines() if ln.strip() and not ln.startswith("#")]


def check_denylist(plugin: Path, terms: list[str], errors: list[str]) -> None:
    allowed = [t[1:] for t in terms if t.startswith("!") and len(t) > 1]
    terms = [t for t in terms if not t.startswith("!")]
    if not terms:
        return
    pattern = re.compile(r"\b(" + "|".join(re.escape(t) for t in terms) + r")\b", re.I)
    allow = re.compile("|".join(re.escape(a) for a in allowed), re.I) if allowed else None
    for f in walk(plugin):
        if f.suffix.lower() not in TEXT_SUFFIXES and f.name not in {"LICENSE"}:
            continue
        try:
            text = f.read_text()
        except UnicodeDecodeError:
            continue
        for n, line in enumerate(text.splitlines(), 1):
            m = pattern.search(allow.sub(" ", line) if allow else line)
            if m:
                errors.append(f"private name: {f.relative_to(plugin)}:{n} contains '{m.group(1)}'")


def lint(plugin: Path, denylist: Path | None) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    notes: list[str] = []
    check_manifest(plugin, errors)
    check_skills(plugin, errors)
    check_placeholders(plugin, errors)
    check_level_maps(plugin, errors)
    if denylist is None or not denylist.exists():
        notes.append("denylist not found; private-name check skipped")
    else:
        check_denylist(plugin, load_denylist(denylist), errors)
    return errors, notes


# ---------------------------------------------------------------- self-test

def _write(p: Path, text: str) -> None:
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text)


def _clean_tree(root: Path, real_schema: Path) -> Path:
    plugin = root / "demo"
    _write(plugin / ".claude-plugin" / "plugin.json", json.dumps(
        {"name": "demo", "version": "0.0.1", "description": "d", "license": "MIT", "author": {"name": "A"}}))
    _write(root / ".claude-plugin" / "marketplace.json", json.dumps(
        {"name": "m", "owner": {"name": "A"}, "plugins": [{"name": "demo", "source": "./demo"}]}))
    _write(plugin / "LICENSE", "MIT")
    _write(plugin / "skills" / "core" / "SKILL.md",
           "---\nname: core\ndescription: Does things.\n---\nSee references/one.md and templates/t.txt.\n")
    _write(plugin / "skills" / "core" / "references" / "one.md", "one\n")
    _write(plugin / "skills" / "core" / "templates" / "t.txt", "no placeholders\n")
    _write(plugin / "schema" / "atomic-design.schema.json", real_schema.read_text())
    _write(plugin / "fixtures" / "app" / ".atomic-design.json",
           json.dumps({"levels": {"atoms": ["src/ui/**"]}, "dataModules": ["axios"]}))
    return plugin


def self_test() -> int:
    real_schema = Path(__file__).resolve().parent.parent / "schema" / "atomic-design.schema.json"
    schema = json.loads(real_schema.read_text())
    failures: list[str] = []
    tmp = Path(tempfile.mkdtemp(prefix="check_plugin_"))
    deny = tmp / "deny.txt"
    deny.write_text("Zorblax\n!zorblax-org\n")

    def case(name: str, mutate, expect: str | None) -> None:
        root = tmp / re.sub(r"\W", "_", name)
        plugin = _clean_tree(root, real_schema)
        mutate(plugin)
        errs, _ = lint(plugin, deny)
        if expect is None:
            if errs:
                failures.append(f"{name}: expected clean, got {errs}")
        elif not any(expect in e for e in errs):
            failures.append(f"{name}: expected an error containing {expect!r}, got {errs}")

    case("clean tree", lambda p: None, None)
    # manifest
    case("bad manifest json", lambda p: _write(p / ".claude-plugin" / "plugin.json", "{nope"), "invalid JSON")
    case("bad marketplace json", lambda p: _write(p.parent / ".claude-plugin" / "marketplace.json", "["), "marketplace")
    case("marketplace source missing", lambda p: _write(p.parent / ".claude-plugin" / "marketplace.json", json.dumps(
        {"name": "m", "plugins": [{"name": "x", "source": "./nowhere"}]})), "no .claude-plugin/plugin.json")
    # frontmatter
    case("no description", lambda p: _write(p / "skills" / "core" / "SKILL.md",
         "---\nname: core\n---\nreferences/one.md templates/t.txt\n"), "lacks description")
    case("name mismatch", lambda p: _write(p / "skills" / "core" / "SKILL.md",
         "---\nname: other\ndescription: x\n---\nreferences/one.md templates/t.txt\n"), "does not match folder")
    # references
    case("orphan reference", lambda p: _write(p / "skills" / "core" / "references" / "lonely.md", "x"), "lonely.md is not mentioned")
    # placeholders
    case("unknown placeholder", lambda p: _write(p / "skills" / "core" / "templates" / "t.txt", "hi {{who}}\n"), "{{who}}")
    case("known placeholder", lambda p: (
        _write(p / "skills" / "core" / "templates" / "t.txt", "hi {{who}}\n"),
        _write(p / "skills" / "atomic-setup" / "SKILL.md", "---\nname: atomic-setup\ndescription: s\n---\nreferences/facts.md\n"),
        _write(p / "skills" / "atomic-setup" / "references" / "facts.md", "Facts: {{who}}\n"),
        _write(p / "skills" / "core" / "SKILL.md",
               "---\nname: core\ndescription: Does things.\n---\nreferences/one.md templates/t.txt\n"),
    ), None)
    # fixture level map
    case("fixture map invalid", lambda p: _write(p / "fixtures" / "app" / ".atomic-design.json",
         json.dumps({"levels": {"atoms": []}})), "dataModules")
    # denylist
    case("denylisted term", lambda p: _write(p / "skills" / "core" / "references" / "one.md", "ok\nA zorblax appears\n"),
         "references/one.md:2 contains 'zorblax'")
    case("allowed phrase", lambda p: _write(p / "skills" / "core" / "references" / "one.md", "ok\nInstall from zorblax-org/x\n"), None)
    case("allowed phrase beside a denied term", lambda p: _write(p / "skills" / "core" / "references" / "one.md", "zorblax-org and Zorblax\n"),
         "references/one.md:1 contains 'Zorblax'")
    case("marketplace beside plugin.json", lambda p: _write(p / ".claude-plugin" / "marketplace.json", json.dumps(
        {"name": "m", "plugins": [{"name": "core", "source": "./"}]})), None)

    # schema cases
    def smap(name: str, data: dict, expect: str | None) -> None:
        errs = validate_map(data, schema)
        if expect is None and errs:
            failures.append(f"map {name}: expected valid, got {errs}")
        if expect is not None and not any(expect in e for e in errs):
            failures.append(f"map {name}: expected {expect!r}, got {errs}")

    base = {"levels": {"atoms": ["src/shared/ui/mui/**"], "molecules": ["src/shared/ui/composite/**"]},
            "dataModules": ["@tanstack/react-query"]}
    smap("minimal valid", base, None)
    smap("full valid", {**base, "containers": "**/*-container.tsx", "locales": ["en"], "themes": ["light"],
         "tests": {"unit": "npx vitest run", "mode": "portable"}, "storybook": {"builder": "vite", "mcp": True},
         "rules": {"doc-card": "warn", "data-in-containers": "error"}, "visual": {"mode": "local"},
         "design": {"mode": "figma"}}, None)
    smap("missing dataModules", {"levels": {}}, "dataModules")
    smap("unknown level", {**base, "levels": {"cells": ["x"]}}, "levels.cells")
    smap("data-in-containers warn", {**base, "rules": {"data-in-containers": "warn"}}, "only be 'error'")
    smap("data-in-containers off", {**base, "rules": {"data-in-containers": "off"}}, "relaxed only through the baseline")
    smap("unknown rule", {**base, "rules": {"made-up": "warn"}}, "rules.made-up")
    smap("bad severity", {**base, "rules": {"doc-card": "fatal"}}, "rules.doc-card")
    smap("code-first without reviewer", {**base, "design": {"mode": "code-first"}}, "reviewer must be named")
    smap("code-first with reviewer", {**base, "design": {"mode": "code-first", "reviewer": "tech lead"}}, None)
    smap("bad tests.mode", {**base, "tests": {"mode": "magic"}}, "tests.mode")
    smap("bad visual.mode", {**base, "visual": {"mode": "pixel"}}, "visual.mode")
    smap("setup fields", {**base, "tests": {"mode": "portable", "note": "n", "vitestProject": "storybook", "upgradeDeclined": True},
         "storybook": {"stories": "src/**/*.stories.tsx", "version": "10.6.5", "mcp": True}, "hook": {"enabled": True},
         "rules": {"a11y": "warn"}}, None)
    smap("a11y off", {**base, "rules": {"a11y": "off"}}, None)
    smap("a11y bad", {**base, "rules": {"a11y": "fatal"}}, "rules.a11y")
    smap("upgradeDeclined type", {**base, "tests": {"upgradeDeclined": "yes"}}, "tests.upgradeDeclined")
    smap("component fields", {**base, "team": "Web team", "review": {"maxVariantProps": 4}}, None)
    smap("empty team", {**base, "team": ""}, "team")
    smap("i18n block", {**base, "i18n": {"scope": "app", "attributes": ["title"], "allow": ["Acme"], "exempt": ["**/icons/**"]}}, None)
    smap("i18n bad scope", {**base, "i18n": {"scope": "page"}}, "i18n.scope")
    smap("i18n unknown key", {**base, "i18n": {"mode": "app"}}, "i18n")
    smap("bad design.mode", {**base, "design": {"mode": "sketch"}}, "design.mode")

    shutil.rmtree(tmp, ignore_errors=True)
    if failures:
        print("self-test FAILED")
        for f in failures:
            print("  -", f)
        return 1
    print("self-test passed")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("plugin", nargs="?", help="plugin directory (default: the plugin this script is in)")
    ap.add_argument("--denylist", help="denylist file (default: ../.private-denylist.txt next to the plugin)")
    ap.add_argument("--self-test", action="store_true", help="run built-in clean and failing cases")
    ap.add_argument("--validate-map", metavar="FILE", help="validate a level map (.atomic-design.json) against the schema and exit")
    args = ap.parse_args()
    if args.validate_map:
        schema_path = Path(__file__).resolve().parent.parent / "schema" / "atomic-design.schema.json"
        problems = validate_map(json.loads(Path(args.validate_map).read_text()), json.loads(schema_path.read_text()))
        for msg in problems:
            print(f"FAIL {msg}")
        print("level map: ok" if not problems else f"{len(problems)} problem(s)")
        return 1 if problems else 0
    if args.self_test:
        return self_test()
    plugin = Path(args.plugin).resolve() if args.plugin else Path(__file__).resolve().parent.parent
    deny = Path(args.denylist) if args.denylist else plugin.parent / ".private-denylist.txt"
    errors, notes = lint(plugin, deny)
    for n in notes:
        print(f"note: {n}")
    if errors:
        for e in errors:
            print(f"FAIL {e}")
        print(f"{len(errors)} problem(s)")
        return 1
    print("check_plugin: ok")
    return 0


if __name__ == "__main__":
    sys.exit(main())
