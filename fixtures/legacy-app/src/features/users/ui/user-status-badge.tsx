import Chip from "@mui/material/Chip";

// SEEDED: badge #2, near-duplicate of shared StatusBadge
type UserStatus = "active" | "pending" | "closed";

const palette: Record<UserStatus, string> = { active: "#2e7d32", pending: "#ed6c02", closed: "#9e9e9e" };

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return <Chip size="small" label={status} sx={{ backgroundColor: palette[status], color: "#ffffff" }} />;
}
