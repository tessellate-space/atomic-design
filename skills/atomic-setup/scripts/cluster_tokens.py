#!/usr/bin/env python3
"""Propose design tokens from the values a repo already uses. Standard library only.

Usage:
  cluster_tokens.py REPO [--delta-e 3] [--grid 4|8] [--json] [--exclude GLOB ...]

Scans .ts .tsx .js .jsx .css .scss under REPO (the whole repo, not only the library),
collects colour literals (hex, rgb(), hsl()), spacing values (padding, margin, gap) and
radii, and clusters them:
  - colours by perceptual distance in OKLab (deltaE = 100 x Euclidean distance; default 3);
    each cluster takes the value of its most-used member;
  - spacing and radii are rounded to the grid, then merged when equal.
Prints a markdown proposal (colour tables per role, spacing, radii) or, with --json, the
same data. It writes nothing: the proposal is for a reviewer to approve.
Roles come from the property each literal is used with (text, surface, border); a
saturated colour is "accent". Names are structural (role and step), never brand words.
"""
from __future__ import annotations

import argparse
import colorsys
import fnmatch
import json
import math
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

SKIP_DIRS = {"node_modules", ".git", "dist", "build", "storybook-static", ".cache", "coverage", ".storybook"}
EXTS = {".ts", ".tsx", ".js", ".jsx", ".css", ".scss"}
HEX = re.compile(r"(?<![\w&])#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])")
FUNC = re.compile(r"\b(rgba?|hsla?)\(\s*([-+.\d][^)]*)\)", re.I)
SPACE_PROP = re.compile(r"\b(padding|margin|gap|row-gap|column-gap|paddingX|paddingY|marginX|marginY)\w*\b\s*[:=]\s*([^;,}\n]+)", re.I)
RADIUS_PROP = re.compile(r"\b(border-radius|borderRadius)\b\s*[:=]\s*[\"'`{]*\s*([^;,}\n]+)", re.I)
LEN = re.compile(r"(?<![\w.#])(\d+(?:\.\d+)?)(px|rem)?\b")


def to_oklab(r: float, g: float, b: float) -> tuple[float, float, float]:
    def lin(c: float) -> float:
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = lin(r), lin(g), lin(b)
    l = (0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b) ** (1 / 3)
    m = (0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b) ** (1 / 3)
    s = (0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b) ** (1 / 3)
    return (0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
            1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
            0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s)


def parse_colour(kind: str, body: str) -> tuple[str, tuple[float, float, float]] | None:
    """Return (canonical #rrggbb, rgb 0..1) for an opaque colour; None when translucent or unparsable."""
    try:
        if kind == "hex":
            h = body
            if len(h) in (3, 4):
                h = "".join(c * 2 for c in h)
            if len(h) == 8:
                if h[6:].lower() != "ff":
                    return None
                h = h[:6]
            rgb = tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
        else:
            parts = [p for p in re.split(r"[\s,/]+", body.strip()) if p]
            if len(parts) > 3 and not re.fullmatch(r"(1|1\.0+|100%)", parts[3]):
                return None
            nums = [float(p.rstrip("%deg")) for p in parts[:3]]
            if kind.startswith("rgb"):
                rgb = tuple(min(max(n / 100 if "%" in parts[i] else n / 255, 0), 1) for i, n in enumerate(nums))
            else:
                rgb = colorsys.hls_to_rgb((nums[0] % 360) / 360, nums[2] / 100, nums[1] / 100)
        return "#%02x%02x%02x" % tuple(round(c * 255) for c in rgb), rgb
    except (ValueError, IndexError):
        return None


def role_of(line: str, at: int) -> str | None:
    before = line[:at].lower()
    tail = re.search(r"([\w-]+)\s*[:=]\s*[\"'`{(]*[^:=]*$", before)
    prop = tail.group(1) if tail else ""
    if re.search(r"border|outline|stroke|divider", prop):
        return "border"
    if re.search(r"background|bgcolor|^bg$|fill|surface", prop):
        return "surface"
    if prop in ("color", "fontcolor") or prop.endswith("color") and "background" not in prop:
        return "text"
    return None


def files(root: Path, exclude: list[str]):
    for p in sorted(root.rglob("*")):
        rel = p.relative_to(root)
        if any(part in SKIP_DIRS for part in rel.parts) or p.suffix not in EXTS or not p.is_file():
            continue
        if any(fnmatch.fnmatch(str(rel), g) for g in exclude):
            continue
        yield rel, p


def round_to_grid(px: float, grid: int) -> int:
    return max(grid * round(px / grid), 0)


def length_px(num: str, unit: str | None) -> float | None:
    v = float(num)
    if unit == "rem":
        return v * 16
    if unit == "px":
        return v
    return v if v >= 1 and v == int(v) and v > 0 else None  # a bare number in a style object is px


def scan(root: Path, exclude: list[str], grid: int):
    colours: dict[str, dict] = {}
    spacing: Counter = Counter()
    radii: Counter = Counter()
    spacing_members: dict[int, Counter] = defaultdict(Counter)
    radii_members: dict[int, Counter] = defaultdict(Counter)
    for rel, p in files(root, exclude):
        try:
            text = p.read_text(errors="ignore")
        except OSError:
            continue
        text = re.sub(r"/\*[\s\S]*?\*/", lambda m: "\n" * m.group(0).count("\n"), text)
        for line in text.splitlines():
            if line.lstrip().startswith("//"):
                continue
            found = [(m.start(), "hex", m.group(1), m.group(0).lower()) for m in HEX.finditer(line)]
            found += [(m.start(), m.group(1).lower(), m.group(2), m.group(0)) for m in FUNC.finditer(line)]
            for at, kind, body, literal in found:
                parsed = parse_colour(kind, body)
                if not parsed:
                    continue
                canon, rgb = parsed
                c = colours.setdefault(canon, {"hex": canon, "oklab": to_oklab(*rgb), "uses": Counter(), "files": set(), "literals": Counter(), "roles": Counter()})
                c["uses"]["n"] += 1
                c["files"].add(str(rel))
                c["literals"][literal] += 1
                role = role_of(line, at)
                if role:
                    c["roles"][role] += 1
            for m in SPACE_PROP.finditer(line):
                for n, u in LEN.findall(m.group(2)):
                    px = length_px(n, u or None)
                    if px:
                        spacing[round_to_grid(px, grid)] += 1
                        spacing_members[round_to_grid(px, grid)][f"{n}{u or ''}"] += 1
            for m in RADIUS_PROP.finditer(line):
                for n, u in LEN.findall(m.group(2)):
                    px = length_px(n, u or None)
                    if px:
                        radii[round_to_grid(px, grid) if px >= grid else px] += 1
                        radii_members[round_to_grid(px, grid) if px >= grid else px][f"{n}{u or ''}"] += 1
    return colours, spacing, spacing_members, radii, radii_members


def cluster(colours: dict, delta_e: float):
    ordered = sorted(colours.values(), key=lambda c: (-c["uses"]["n"], c["hex"]))
    clusters: list[dict] = []
    for c in ordered:
        for cl in clusters:
            d = 100 * math.dist(c["oklab"], cl["centre"]["oklab"])
            if d < delta_e:
                cl["members"].append(c)
                break
        else:
            clusters.append({"centre": c, "members": [c]})
    out = []
    for cl in clusters:
        L, a, b = cl["centre"]["oklab"]
        chroma = math.hypot(a, b)
        roles = Counter()
        for m in cl["members"]:
            roles.update(m["roles"])
        role = "accent" if chroma > 0.1 else (roles.most_common(1)[0][0] if roles else ("surface" if L > 0.9 else "text"))
        out.append({
            "role": role, "value": cl["centre"]["hex"], "lightness": round(L, 3),
            "uses": sum(m["uses"]["n"] for m in cl["members"]),
            "files": len(set().union(*(m["files"] for m in cl["members"]))),
            "members": [{"value": m["hex"], "literals": sorted(m["literals"]), "uses": m["uses"]["n"],
                         "deltaE": round(100 * math.dist(m["oklab"], cl["centre"]["oklab"]), 2)} for m in cl["members"]],
        })
    out.sort(key=lambda t: (t["role"], -t["uses"], t["value"]))
    step: Counter = Counter()
    for t in out:
        step[t["role"]] += 1
        t["name"] = f"color-{t['role']}-{step[t['role']]}"
    return out


def build(root: Path, delta_e: float, grid: int, exclude: list[str]) -> dict:
    colours, spacing, sm, radii, rm = scan(root, exclude, grid)
    tokens = cluster(colours, delta_e)
    return {
        "deltaE": delta_e, "grid": grid,
        "literals": sum(sum(m["literals"].values()) for m in colours.values()),
        "distinctColours": len(colours),
        "colour": tokens,
        "spacing": [{"name": f"spacing-{v}", "value": f"{v}px", "uses": n, "absorbs": dict(sm[v])} for v, n in sorted(spacing.items())],
        "radii": [{"name": f"radius-{v}", "value": f"{v}px", "uses": n, "absorbs": dict(rm[v])} for v, n in sorted(radii.items())],
    }


def markdown(data: dict) -> str:
    out = [f"{data['distinctColours']} distinct colour values ({data['literals']} uses) collapse to "
           f"{len(data['colour'])} tokens at deltaE < {data['deltaE']}.\n"]
    for role in ("surface", "text", "border", "accent"):
        rows = [t for t in data["colour"] if t["role"] == role]
        if not rows:
            continue
        out += [f"### {role.capitalize()}\n", "| Token | Value | Absorbs | Uses |", "|---|---|---|---|"]
        for t in rows:
            absorbs = ", ".join(f"{m['value']} x{m['uses']}" + (f" (dE {m['deltaE']})" if m["deltaE"] else "") for m in t["members"])
            out.append(f"| `{t['name']}` | `{t['value']}` | {absorbs} | {t['uses']} in {t['files']} files |")
        out.append("")
    for key, title in (("spacing", "Spacing"), ("radii", "Radii")):
        out += [f"### {title}\n", "| Token | Value | Absorbs | Uses |", "|---|---|---|---|"]
        for t in data[key]:
            out.append(f"| `{t['name']}` | `{t['value']}` | {', '.join(f'{k} x{v}' for k, v in t['absorbs'].items())} | {t['uses']} |")
        out.append("")
    return "\n".join(out)


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("repo")
    ap.add_argument("--delta-e", type=float, default=3.0)
    ap.add_argument("--grid", type=int, choices=(4, 8), default=4)
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--exclude", action="append", default=[])
    a = ap.parse_args(argv)
    root = Path(a.repo).resolve()
    if not root.is_dir():
        print(f"not a folder: {root}", file=sys.stderr)
        return 2
    data = build(root, a.delta_e, a.grid, a.exclude)
    print(json.dumps(data, indent=2) if a.json else markdown(data))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
