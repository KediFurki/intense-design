export type LocaleKey = "bg" | "en" | "tr" | "de";

export type LocalizedText = Partial<Record<LocaleKey, string>> | string | null | undefined;

const FALLBACK_ORDER: LocaleKey[] = ["bg", "en", "tr", "de"];

export function getLocaleValue(value: LocalizedText, locale: string): string {
  if (!value) return "";
  if (typeof value === "string") return value;

  const key = (locale?.toLowerCase() as LocaleKey) || "en";
  const obj = value as Partial<Record<LocaleKey, string>>;

  // 1) exact locale
  if (obj[key]) return obj[key] as string;

  // 2) fallback chain
  for (const k of FALLBACK_ORDER) {
    if (obj[k]) return obj[k] as string;
  }

  // 3) last resort: first string value
  const first = Object.values(obj).find((v) => typeof v === "string" && v.trim().length > 0);
  return first ?? "";
}