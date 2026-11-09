import { useTranslation } from "react-i18next";
import { OrdersContainer } from "~/features/orders/orders-container";

export default function OrdersPage() {
  const { t } = useTranslation();
  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-semibold">{t("orders.title")}</h1>
      <OrdersContainer />
    </main>
  );
}
