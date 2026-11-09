import { useQuery } from "@tanstack/react-query";
import { fetchOrders } from "~/lib/api";
import { OrderList } from "./ui/order-list";

export function OrdersContainer() {
  const orders = useQuery({ queryKey: ["orders"], queryFn: fetchOrders });
  return <OrderList orders={orders.data ?? []} />;
}
