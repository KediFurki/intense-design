"use client";

import { useTranslations } from "next-intl";

export default function MaintenanceScreen() {
  const t = useTranslations("Maintenance");

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#faf7f2] overflow-hidden">
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[#eadfce]/40 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[30rem] w-[30rem] rounded-full bg-[#d4c4a8]/30 blur-3xl" />
        <div className="absolute top-1/4 right-1/4 h-64 w-64 rounded-full bg-[#c9b896]/15 blur-2xl" />
      </div>

      {/* Subtle top border accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#b08f74] to-transparent" />

      {/* Content */}
      <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center px-6 text-center">
        {/* Logo mark */}
        <div className="mb-10 flex h-20 w-20 items-center justify-center rounded-full border border-[#d4c4a8]/60 bg-white/70 shadow-sm backdrop-blur-sm">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-9 w-9 text-[#8b6a52]"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>

        {/* Brand */}
        <h1 className="font-serif text-4xl font-light tracking-wide text-[#4e3629] sm:text-5xl">
          Intense Design
        </h1>

        {/* Divider */}
        <div className="my-8 flex items-center gap-4">
          <span className="h-px w-12 bg-[#c9b896]" />
          <span className="h-1.5 w-1.5 rotate-45 bg-[#b08f74]" />
          <span className="h-px w-12 bg-[#c9b896]" />
        </div>

        {/* Heading */}
        <h2 className="text-lg font-medium tracking-wide text-[#6f4e37] sm:text-xl">
          {t("title")}
        </h2>

        {/* Description */}
        <p className="mt-4 max-w-md text-sm leading-relaxed text-[#8b6a52]/80 sm:text-base">
          {t("description")}
        </p>

        {/* Decorative line */}
        <div className="mt-12 flex items-center gap-3 text-xs tracking-[0.3em] uppercase text-[#b08f74]">
          <span className="h-px w-6 bg-[#c9b896]" />
          {t("comingSoon")}
          <span className="h-px w-6 bg-[#c9b896]" />
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-xs tracking-wider text-[#b08f74]/60">
        © {new Date().getFullYear()} Intense Design
      </div>
    </div>
  );
}
