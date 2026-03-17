import { FooterPageShell } from "@/components/layout/footer-page-shell";
import { getTranslations } from "next-intl/server";

export default async function LocationPage() {
  const t = await getTranslations("StaticPages");

  return <FooterPageShell eyebrow={t("brand")} title={t("location")} description={t("underConstruction")} />;
}