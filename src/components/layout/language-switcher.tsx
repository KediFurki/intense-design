"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { startTransition } from "react";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleValueChange = (nextLocale: string) => {
    startTransition(() => {
      // HATA DÜZELTİLDİ: Artık tip hatası vermediği için o satırı sildik
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <Select defaultValue={locale} onValueChange={handleValueChange}>
      <SelectTrigger className="w-[70px] h-9 border-none shadow-none bg-transparent focus:ring-0 font-medium">
        <SelectValue placeholder="Lang" />
      </SelectTrigger>
      <SelectContent align="end" className="min-w-[100px]">
        <SelectItem value="en">🇬🇧 EN</SelectItem>
        <SelectItem value="tr">🇹🇷 TR</SelectItem>
        <SelectItem value="bg">🇧🇬 BG</SelectItem>
        <SelectItem value="de">🇩🇪 DE</SelectItem>
      </SelectContent>
    </Select>
  );
}