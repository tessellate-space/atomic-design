export type Profile = { name: string };

export async function fetchProfile(): Promise<Profile> {
  const res = await fetch("/api/profile");
  if (!res.ok) throw new Error(`profile ${res.status}`);
  return (await res.json()) as Profile;
}

export type Order = { id: string; customer: string; status: "open" | "shipped" | "cancelled" };

export async function fetchOrders(): Promise<Order[]> {
  const res = await fetch("/api/orders");
  if (!res.ok) throw new Error(`orders ${res.status}`);
  return (await res.json()) as Order[];
}
