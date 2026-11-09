import { OrderList } from "@/features/orders/ui/order-list";
import { UserCard } from "@/features/users/ui/user-card";

export function Dashboard() {
  return (
    <div style={{ background: "#f5f5f5", padding: 16 }}>
      <UserCard />
      <OrderList />
    </div>
  );
}
