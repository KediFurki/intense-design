import { FooterPageShell } from "@/components/layout/footer-page-shell";
import { getTranslations } from "next-intl/server";

export default async function AboutPage() {
  const t = await getTranslations("StaticPages");

  return <FooterPageShell eyebrow={t("brand")} title={t("about")} description={t("underConstruction")} />;
}