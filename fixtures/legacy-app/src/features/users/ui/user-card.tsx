import { useQuery } from "@tanstack/react-query";
import { getJson } from "@/shared/api/client";
import { InfoCard } from "@/shared/ui/composite/info-card";
import { AppButton } from "@/shared/ui/mui/app-button";
import { UserStatusBadge } from "./user-status-badge";

// SEEDED: library-level component that fetches data (via TanStack Query)
type User = { name: string; email: string; status: "active" | "pending" | "closed" };

export function UserCard() {
  const { data } = useQuery({ queryKey: ["me"], queryFn: () => getJson<User>("/api/me") });
  if (!data) return <p style={{ color: "#888888" }}>Loading...</p>;
  return (
    <InfoCard title={data.name} subtitle={data.email} bordered elevated footer={<AppButton>Edit</AppButton>}>
      <UserStatusBadge status={data.status} />
    </InfoCard>
  );
}
