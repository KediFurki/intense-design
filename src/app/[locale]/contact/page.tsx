import { FooterPageShell } from "@/components/layout/footer-page-shell";
import { getTranslations } from "next-intl/server";

export default async function ContactPage() {
  const t = await getTranslations("StaticPages");

  return <FooterPageShell eyebrow={t("brand")} title={t("contact")} description={t("underConstruction")} />;
}