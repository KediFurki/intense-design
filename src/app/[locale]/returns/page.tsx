import { FooterPageShell } from "@/components/layout/footer-page-shell";
import { getTranslations } from "next-intl/server";

export default async function ReturnsPage() {
  const t = await getTranslations("StaticPages");

  return <FooterPageShell eyebrow={t("customerService")} title={t("returns")} description={t("underConstruction")} />;
}