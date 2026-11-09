import { useTranslation } from "react-i18next";
import type { Order } from "~/lib/api";

export function OrderList({ orders }: { orders: Order[] }) {
  const { t } = useTranslation();
  if (orders.length === 0) return <p className="text-sm text-gray-500">{t("orders.empty")}</p>;
  return (
    <ul className="divide-y">
      {orders.map((o) => (
        <li key={o.id} className="flex justify-between py-2">
          <span>{o.customer}</span>
          <span>{t(`orders.status.${o.status}`)}</span>
        </li>
      ))}
    </ul>
  );
}
