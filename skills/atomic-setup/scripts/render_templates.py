#!/usr/bin/env python3
"""Render atomic-setup templates with a facts file. Standard library only.

Usage:
  render_templates.py FACTS.json TEMPLATE OUT        render one template
  render_templates.py FACTS.json --check TEMPLATE... render to memory; exit 1 on a leftover placeholder

FACTS.json is a flat object. String and list values fill {{name}} (lists as JSON).
Boolean values switch blocks:   // atomic:if name   ...   // atomic:end
A block is kept when the flag is true and dropped when it is false or missing.
An empty locales_json / themes_json becomes [default_locale] / [default_theme]; with no default, exit 1.
The marker lines themselves never reach the output.
A line `// atomic:runner-import a,b` becomes `import { a, b } from "vitest";` when the fact
`test_runner` is "vitest", and is dropped for "jest" (globals). A placeholder with no fact is an error.
"""
import json
import re
import sys
from pathlib import Path

PLACEHOLDER = re.compile(r"\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}")
RUNNER = re.compile(r"^\s*//\s*atomic:runner-import\s+([A-Za-z,]+)")
MARK = re.compile(r"^\s*(?://|#|<!--)\s*atomic:(if|end)\b\s*([A-Za-z0-9_]*)")


def normalize(facts: dict) -> dict:
    """Locales and themes are never empty: an empty list composes no stories ("No test found").
    An empty list falls back to [default_locale] / [default_theme]; with no default it is an error."""
    facts = dict(facts)
    for key, default in (("locales_json", "default_locale"), ("themes_json", "default_theme")):
        if key in facts and isinstance(facts[key], list) and not facts[key]:
            if not facts.get(default):
                raise ValueError(f"{key} is empty and there is no {default} to fall back to")
            facts[key] = [facts[default]]
    return facts


def render(text: str, facts: dict) -> str:
    facts = normalize(facts)
    out, stack = [], []
    for line in text.splitlines(keepends=True):
        rm = RUNNER.match(line)
        if rm:
            if all(stack) and facts.get("test_runner") == "vitest":
                out.append('import { %s } from "vitest";\n' % ", ".join(rm.group(1).split(",")))
            continue
        m = MARK.match(line)
        if m:
            if m.group(1) == "if":
                stack.append(bool(facts.get(m.group(2))))
            else:
                stack.pop()
            continue
        if all(stack):
            out.append(line)
    if stack:
        raise ValueError("unclosed atomic:if block")

    def sub(m):
        key = m.group(1)
        if key not in facts or isinstance(facts[key], bool):
            raise KeyError(key)
        v = facts[key]
        return v if isinstance(v, str) else json.dumps(v)

    return PLACEHOLDER.sub(sub, "".join(out))


def main(argv):
    if len(argv) < 3:
        print(__doc__)
        return 2
    facts = json.loads(Path(argv[1]).read_text())
    try:
        normalize(facts)
    except ValueError as e:
        print(f"{argv[1]}: {e}")
        return 1
    if argv[2] == "--check":
        bad = 0
        for t in argv[3:]:
            try:
                render(Path(t).read_text(), facts)
            except KeyError as e:
                print(f"{t}: no fact for {{{{{e.args[0]}}}}}")
                bad = 1
        return bad
    try:
        rendered = render(Path(argv[2]).read_text(), facts)
    except KeyError as e:
        print(f"{argv[2]}: no fact for {{{{{e.args[0]}}}}}")
        return 1
    Path(argv[3]).parent.mkdir(parents=True, exist_ok=True)
    Path(argv[3]).write_text(rendered)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
