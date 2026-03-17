import { FooterPageShell } from "@/components/layout/footer-page-shell";
import { getTranslations } from "next-intl/server";

export default async function ShippingPage() {
  const t = await getTranslations("StaticPages");

  return <FooterPageShell eyebrow={t("customerService")} title={t("shipping")} description={t("underConstruction")} />;
}