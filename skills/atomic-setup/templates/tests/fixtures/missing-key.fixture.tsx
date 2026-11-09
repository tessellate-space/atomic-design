import { useTranslation } from "react-i18next";
import i18n from "{{i18n_module}}";

// The key exists only in the source locale, added at runtime so no catalog is touched.
i18n.addResource("{{default_locale}}", "translation", "fixture.onlyInSourceLocale", "ok");

function Copy() {
  const { t } = useTranslation();
  return <p>{t("fixture.onlyInSourceLocale")}</p>;
}
export default { title: "Harness/MissingKey", render: () => <Copy /> };
export const OnlyEnglish = {};
