import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

// Foundations: the design tokens, read from the page at render time. Nothing here is a copied
// list: a custom property added to the token source shows up without editing this file.
// Written by `atomic-design:foundations`; safe to edit.

type Token = { name: string; value: string };
type Groups = Record<"colour" | "fontFamily" | "type" | "spacing" | "radius" | "shadow", Token[]>;

const ROOTS = /(^|,\s*)(:root|:host|html|body|\.{{dark_class}}|\[data-[\w-]+[^\]]*\])\s*(,|$)/;
const INTERNAL = /^--(tw-|sb-|default-|storybook)/;
const COLOUR_VALUE = /^(#|rgba?\(|hsla?\(|oklch\(|oklab\(|lab\(|lch\(|color\()/i;

function declared(rules: CSSRuleList, out: Set<string>) {
  for (const rule of Array.from(rules)) {
    if (rule instanceof CSSStyleRule && ROOTS.test(rule.selectorText)) {
      for (const prop of Array.from(rule.style)) if (prop.startsWith("--") && !INTERNAL.test(prop)) out.add(prop);
    }
    const inner = (rule as { cssRules?: CSSRuleList }).cssRules;
    if (inner) declared(inner, out);
  }
}

function readTokens(): Groups {
  const names = new Set<string>();
  for (const sheet of Array.from(document.styleSheets)) {
    try { declared(sheet.cssRules, names); } catch { /* a cross-origin sheet cannot be read */ }
  }
  const style = getComputedStyle(document.documentElement);
  const groups: Groups = { colour: [], fontFamily: [], type: [], spacing: [], radius: [], shadow: [] };
  for (const name of [...names].sort()) {
    const value = style.getPropertyValue(name).trim();
    if (!value) continue;
    const token = { name, value };
    if (/^--(font-weight|font-size|text|leading|tracking|line-height|letter-spacing)/.test(name)) groups.type.push(token);
    else if (/^--(font|family)/.test(name)) groups.fontFamily.push(token);
    else if (/^--(spacing|space|gap)/.test(name)) groups.spacing.push(token);
    else if (/^--(radius|rounded)/.test(name)) groups.radius.push(token);
    else if (/^--(shadow|elevation|drop-shadow)/.test(name)) groups.shadow.push(token);
    else if (/^--(color|colour)/.test(name) || COLOUR_VALUE.test(value)) groups.colour.push(token);
  }
  return groups;
}

function useTokens(): Groups {
  const [groups, setGroups] = useState<Groups>(readTokens);
  useEffect(() => {
    const read = () => setGroups(readTokens());
    read();
    // A theme switch changes the class or attribute on <html>; a token edit rewrites a <style> element.
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true });
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);
  return groups;
}

const grid: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(11rem, 1fr))", gap: "1rem" };
const caption: CSSProperties = { font: "inherit", fontSize: "0.75rem", opacity: 0.7, wordBreak: "break-all" };

function Section({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <section style={{ marginBottom: "2rem" }}>
      <h3 style={{ margin: "0 0 0.75rem" }}>{title} ({count})</h3>
      {count === 0 ? <p style={caption}>No tokens of this kind were found in the stylesheets.</p> : children}
    </section>
  );
}

function Foundations() {
  const { colour, fontFamily, type, spacing, radius, shadow } = useTokens();
  return (
    <div style={{ padding: "1.5rem", fontFamily: "inherit" }}>
      <Section title="Colour" count={colour.length}>
        <div style={grid}>
          {colour.map((t) => (
            <figure key={t.name} style={{ margin: 0 }}>
              <div style={{ height: "3.5rem", borderRadius: "0.375rem", background: `var(${t.name})`, border: "1px solid currentColor" }} />
              <figcaption style={caption}><code>{t.name}</code><br />{t.value}</figcaption>
            </figure>
          ))}
        </div>
      </Section>
      <Section title="Type" count={fontFamily.length + type.length}>
        {fontFamily.map((t) => (
          <p key={t.name} style={{ fontFamily: `var(${t.name})`, fontSize: "1.25rem", margin: "0 0 0.5rem" }}>
            The quick brown fox jumps over the lazy dog <span style={caption}><code>{t.name}</code> {t.value}</span>
          </p>
        ))}
        {type.map((t) => (
          <p key={t.name} style={{ margin: "0 0 0.5rem", ...(/weight/.test(t.name) ? { fontWeight: `var(${t.name})` } : /size|text/.test(t.name) ? { fontSize: `var(${t.name})` } : {}) }}>
            Aa Bb Cc <span style={caption}><code>{t.name}</code> {t.value}</span>
          </p>
        ))}
      </Section>
      <Section title="Spacing" count={spacing.length}>
        {spacing.map((t) => (
          <div key={t.name} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <span style={{ ...caption, width: "12rem" }}><code>{t.name}</code> {t.value}</span>
            {/* A single base unit (Tailwind's --spacing) is shown as multiples of the grid. */}
            {(t.name === "--spacing" ? [1, 2, 4, 8] : [1]).map((n) => (
              <span key={n} style={{ display: "inline-block", height: "1rem", width: `calc(var(${t.name}) * ${n})`, background: "currentColor", opacity: 0.35 }} />
            ))}
          </div>
        ))}
      </Section>
      <Section title="Radii" count={radius.length}>
        <div style={grid}>
          {radius.map((t) => (
            <figure key={t.name} style={{ margin: 0 }}>
              <div style={{ height: "3.5rem", border: "2px solid currentColor", borderRadius: `var(${t.name})` }} />
              <figcaption style={caption}><code>{t.name}</code><br />{t.value}</figcaption>
            </figure>
          ))}
        </div>
      </Section>
      <Section title="Elevation" count={shadow.length}>
        <div style={grid}>
          {shadow.map((t) => (
            <figure key={t.name} style={{ margin: 0 }}>
              <div style={{ height: "3.5rem", borderRadius: "0.375rem", boxShadow: `var(${t.name})` }} />
              <figcaption style={caption}><code>{t.name}</code></figcaption>
            </figure>
          ))}
        </div>
      </Section>
    </div>
  );
}

const meta = { title: "Foundations/Tokens", component: Foundations, parameters: { layout: "fullscreen" } } satisfies Meta<typeof Foundations>;
export default meta;
export const Tokens: StoryObj<typeof meta> = {};
