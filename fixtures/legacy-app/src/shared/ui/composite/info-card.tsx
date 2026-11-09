import type { ReactNode } from "react";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";

// SEEDED: variant-heavy card (nine presentational props)
export type InfoCardProps = {
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  tone?: "plain" | "info" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
  elevated?: boolean;
  bordered?: boolean;
  compact?: boolean;
  inverted?: boolean;
  children?: ReactNode;
};

export function InfoCard({ title, subtitle, footer, tone = "plain", size = "md", elevated, bordered, compact, inverted, children }: InfoCardProps) {
  const bg = inverted ? "#333333" : tone === "danger" ? "#fdecea" : tone === "warning" ? "#fff4e5" : tone === "info" ? "#e8f1fb" : "#f5f5f5";
  const pad = compact ? 1 : size === "lg" ? 3 : size === "sm" ? 1.5 : 2;
  return (
    <Card elevation={elevated ? 3 : 0} sx={{ p: pad, background: bg, border: bordered ? "1px solid #cccccc" : "none", color: inverted ? "#fff" : "inherit" }}>
      <Typography variant="h6">{title}</Typography>
      {subtitle ? <Typography sx={{ color: "#888888" }}>{subtitle}</Typography> : null}
      {children}
      {footer}
    </Card>
  );
}
