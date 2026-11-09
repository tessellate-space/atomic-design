import Chip from "@mui/material/Chip";

// SEEDED: badge #1
export type Status = "active" | "pending" | "closed";

const colors: Record<Status, string> = { active: "#2e7d32", pending: "#ed6c02", closed: "#999999" };

export function StatusBadge({ status }: { status: Status }) {
  return <Chip size="small" label={status} sx={{ backgroundColor: colors[status], color: "#fff" }} />;
}
