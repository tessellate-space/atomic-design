import type { ReactNode } from "react";
import { Controls, Description, Primary, Stories, Subtitle, Title, useOf } from "@storybook/addon-docs/blocks";

// The docs page of every component: the doc card (`parameters.atomic` in the story file)
// above the props table and the live stories. Written by `atomic-design:setup`; the card's
// fields are described in the plugin's `doc-card.md`, and the suite checks `status` and `owner`.
type Card = {
  status?: string;
  owner?: string;
  design?: string;
  derivedFrom?: string;
  flow?: string;
  dos?: string[];
  donts?: string[];
  combinesWith?: string[];
  approvedBy?: string;
  approvedOn?: string;
  replacedBy?: string;
};

const box = { border: "1px solid currentColor", borderRadius: 6, padding: "12px 16px", margin: "16px 0", opacity: 0.95 } as const;
const row = (label: string, value: ReactNode) => (
  <div style={{ display: "flex", gap: 12, padding: "2px 0" }}>
    <strong style={{ minWidth: 110 }}>{label}</strong>
    <span>{value}</span>
  </div>
);
const list = (items?: string[]) => (items?.length ? <ul style={{ margin: 0, paddingLeft: 18 }}>{items.map((i) => <li key={i}>{i}</li>)}</ul> : "-");

function designText(card: Card): ReactNode {
  if (!card.design) return "not yet agreed with design";
  if (card.design === "storybook") {
    return `these stories${card.derivedFrom ? `, derived from ${card.derivedFrom}` : ""}${card.status === "stable" ? "" : "; not yet reviewed"}`;
  }
  return /^https?:/.test(card.design) ? <a href={card.design}>{card.design}</a> : card.design;
}

export function AtomicCard({ card }: { card?: Card }) {
  if (!card) return <div style={box}>No doc card yet. Add <code>parameters.atomic</code> to the stories.</div>;
  const status = card.status ?? "missing";
  return (
    <div style={box} data-testid="atomic-card">
      {card.status === "deprecated" && (
        <div role="note" data-testid="atomic-deprecated" style={{ ...box, margin: "0 0 12px", fontWeight: 600 }}>
          Deprecated{card.replacedBy ? <>: use <code>{card.replacedBy}</code> instead.</> : ": do not use in new code."}
        </div>
      )}
      {row("Status", card.status === "stable" && card.approvedBy ? `stable (approved by ${card.approvedBy}${card.approvedOn ? `, ${card.approvedOn}` : ""})` : status)}
      {row("Owner", card.owner ?? "missing")}
      {row("Design", designText(card))}
      {row("In the flow", card.flow ?? "-")}
      {row("Do", list(card.dos))}
      {row("Don't", list(card.donts))}
      {row("Combines with", list(card.combinesWith))}
    </div>
  );
}

export function AtomicDocsPage() {
  const meta = useOf("meta", ["meta"]);
  const card = (meta.preparedMeta.parameters as { atomic?: Card } | undefined)?.atomic;
  return (
    <>
      <Title />
      <Subtitle />
      <AtomicCard card={card} />
      <Description />
      <Primary />
      <Controls />
      <Stories />
    </>
  );
}
