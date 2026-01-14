export type LocaleKey = "bg" | "en" | "tr" | "de";
export type LocalizedText = Partial<Record<LocaleKey, string>> | string | null | undefined;

const FALLBACK: LocaleKey[] = ["bg", "en", "tr", "de"];

export function getLocaleValue(value: LocalizedText, locale: string): string {
  if (!value) return "";
  if (typeof value === "string") return value;

  const obj = value as Partial<Record<LocaleKey, string>>;
  const key = (locale?.toLowerCase() as LocaleKey) || "en";

  if (obj[key]) return obj[key] as string;
  for (const k of FALLBACK) if (obj[k]) return obj[k] as string;

  const first = Object.values(obj).find((v) => typeof v === "string" && v.trim().length > 0);
  return first ?? "";
}