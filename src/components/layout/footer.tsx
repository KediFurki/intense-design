import { Link } from "@/lib/i18n/routing";
import { useLocale, useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("Footer");
  const locale = useLocale();

  return (
    <footer className="border-t border-stone-200 bg-stone-50 text-stone-800">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[1.25fr_0.9fr_1fr]">
          <div className="max-w-md space-y-5">
            <Link
              href="/"
              className="inline-flex items-center text-2xl font-semibold tracking-[0.24em] text-stone-900 uppercase transition-colors hover:text-stone-700"
            >
              Intense Design
            </Link>
            <p className="text-sm leading-7 text-stone-600 sm:text-[15px]">
              {t("brandSlogan")}
            </p>
          </div>

          <div className="space-y-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-900">
              {t("company")}
            </h3>
            <nav className="flex flex-col gap-3 text-sm text-stone-600">
              <Link href="/about" className="transition-colors hover:text-stone-900">
                {t("aboutUs")}
              </Link>
              <Link href="/location" className="transition-colors hover:text-stone-900">
                {t("location")}
              </Link>
              <Link href="/contact" className="transition-colors hover:text-stone-900">
                {t("contact")}
              </Link>
            </nav>
          </div>

          <div className="space-y-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-900">
              {t("customerService")}
            </h3>
            <nav className="flex flex-col gap-3 text-sm text-stone-600">
              <Link href="/help" className="transition-colors hover:text-stone-900">
                {t("help")}
              </Link>
              <Link href="/shipping" className="transition-colors hover:text-stone-900">
                {t("shipping")}
              </Link>
              <Link href="/returns" className="transition-colors hover:text-stone-900">
                {t("returns")}
              </Link>
              <Link href="/assembly" className="transition-colors hover:text-stone-900">
                {t("assembly")}
              </Link>
            </nav>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-5 border-t border-stone-200 pt-6 text-xs text-stone-500 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} Intense Design. {t("allRightsReserved")}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <a
              href="https://www.iubenda.com/privacy-policy/69743893"
              className="iubenda-white iubenda-noiframe iubenda-embed transition-colors hover:text-stone-800"
              title={t("privacyPolicy")}
            >
              {t("privacyPolicy")}
            </a>
            <a
              href="https://www.iubenda.com/privacy-policy/69743893/cookie-policy"
              className="iubenda-white iubenda-noiframe iubenda-embed transition-colors hover:text-stone-800"
              title={t("cookiePolicy")}
            >
              {t("cookiePolicy")}
            </a>
            <a
              href={`/${locale}#iubenda-privacy-choices`}
              className="iubenda-cs-preferences-link transition-colors hover:text-stone-800"
            >
              {t("privacyChoices")}
            </a>
            <a
              href={`/${locale}#iubenda-notice-at-collection`}
              className="iubenda-cs-uspr-link transition-colors hover:text-stone-800"
            >
              {t("noticeAtCollection")}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}