import { useEffect, useState } from "react";
import { getJson } from "@/shared/api/client";
import { StatusBadge, type Status } from "@/shared/ui/mui/status-badge";
import { PrimaryButton } from "@/shared/ui/mui/primary-button";

// SEEDED: library-level component that fetches data (via the API client)
type Order = { id: string; title: string; status: Status };

export function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => {
    void getJson<Order[]>("/api/orders").then(setOrders);
  }, []);
  return (
    <section>
      <ul style={{ color: "#999999" }}>
        {orders.map((o) => (
          <li key={o.id}>
            {o.title} <StatusBadge status={o.status} />
          </li>
        ))}
      </ul>
      <PrimaryButton onClick={() => setOrders([])}>Clear</PrimaryButton>
    </section>
  );
}
