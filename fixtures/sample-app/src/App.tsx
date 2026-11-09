import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "~/components/ui/button";
import { fetchProfile } from "~/lib/api";

export default function App() {
  const { t } = useTranslation();
  const profile = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });
  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      {profile.data ? <p>{t("greeting", { name: profile.data.name })}</p> : null}
      <Button>{t("cta")}</Button>
    </main>
  );
}
