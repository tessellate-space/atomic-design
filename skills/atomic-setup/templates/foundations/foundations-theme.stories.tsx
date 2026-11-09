import type { CSSProperties, ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { {{theme_export}} as themeSource } from "{{theme_import}}";

// Foundations for a theme-object kit: the app's own theme, imported, never copied. A value
// added to the theme shows up without editing this file. Written by `atomic-design:foundations`.

type Bag = Record<string, unknown>;
const bag = (v: unknown): Bag => (v !== null && typeof v === "object" ? (v as Bag) : {});
const COLOUR_VALUE = /^(#|rgba?\(|hsla?\(|oklch\(|oklab\(|lab\(|lch\(|color\()/i;
const theme = themeSource as unknown as Bag;

function colours(prefix: string, node: unknown, out: Array<[string, string]> = []): Array<[string, string]> {
  for (const [key, value] of Object.entries(bag(node))) {
    if (typeof value === "string" && COLOUR_VALUE.test(value)) out.push([`${prefix}.${key}`, value]);
    else if (value && typeof value === "object") colours(`${prefix}.${key}`, value, out);
  }
  return out;
}

const grid: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(11rem, 1fr))", gap: "1rem" };
const caption: CSSProperties = { font: "inherit", fontSize: "0.75rem", opacity: 0.7, wordBreak: "break-all" };

function Section({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <section style={{ marginBottom: "2rem" }}>
      <h3 style={{ margin: "0 0 0.75rem" }}>{title} ({count})</h3>
      {count === 0 ? <p style={caption}>Nothing of this kind was found on the theme.</p> : children}
    </section>
  );
}

function Foundations() {
  const palette = colours("palette", theme.palette);
  const typography = Object.entries(bag(theme.typography)).filter(([, v]) => v && typeof v === "object" && "fontSize" in bag(v));
  const spacing = typeof theme.spacing === "function" ? [1, 2, 3, 4, 6, 8].map((n) => [n, String((theme.spacing as (n: number) => unknown)(n))] as const) : [];
  const radius = bag(theme.shape).borderRadius;
  const shadows = Array.isArray(theme.shadows) ? (theme.shadows as string[]).map((s, i) => [i, s] as const).filter(([, s]) => s !== "none") : [];
  return (
    <div style={{ padding: "1.5rem" }}>
      <Section title="Colour" count={palette.length}>
        <div style={grid}>
          {palette.map(([name, value]) => (
            <figure key={name} style={{ margin: 0 }}>
              <div style={{ height: "3.5rem", borderRadius: "0.375rem", background: value, border: "1px solid currentColor" }} />
              <figcaption style={caption}><code>{name}</code><br />{value}</figcaption>
            </figure>
          ))}
        </div>
      </Section>
      <Section title="Type" count={typography.length}>
        {typography.map(([name, v]) => (
          <p key={name} style={{ margin: "0 0 0.5rem", ...(v as CSSProperties) }}>
            Aa Bb Cc <span style={caption}><code>typography.{name}</code></span>
          </p>
        ))}
      </Section>
      <Section title="Spacing" count={spacing.length}>
        {spacing.map(([n, px]) => (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <span style={{ ...caption, width: "12rem" }}><code>spacing({n})</code> {px}</span>
            <span style={{ display: "inline-block", height: "1rem", width: px, background: "currentColor", opacity: 0.35 }} />
          </div>
        ))}
      </Section>
      <Section title="Radii" count={radius === undefined ? 0 : 1}>
        <div style={{ height: "3.5rem", width: "11rem", border: "2px solid currentColor", borderRadius: Number(radius) }} />
        <p style={caption}><code>shape.borderRadius</code> {String(radius)}</p>
      </Section>
      <Section title="Elevation" count={shadows.length}>
        <div style={grid}>
          {shadows.map(([i, s]) => (
            <figure key={i} style={{ margin: 0 }}>
              <div style={{ height: "3.5rem", borderRadius: "0.375rem", boxShadow: s }} />
              <figcaption style={caption}><code>shadows[{i}]</code></figcaption>
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
