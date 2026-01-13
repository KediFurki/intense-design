"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { startTransition } from "react";

// Basit SVG Bayraklar
const Flags = {
  en: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" width="20" height="15">
      <clipPath id="s"><path d="M0,0 v30 h60 v-30 z"/></clipPath>
      <clipPath id="t"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath>
      <g clipPath="url(#s)">
        <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
        <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#C8102E" strokeWidth="4"/>
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
      </g>
    </svg>
  ),
  tr: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="20" height="15">
      <path fill="#E30A17" d="M0 0h1200v800H0z"/>
      <circle cx="444" cy="400" r="200" fill="#fff"/>
      <circle cx="480" cy="400" r="160" fill="#E30A17"/>
      <path fill="#fff" transform="rotate(-47.6 673 408)" d="M673 316l25 78 78 25-78 25-25 78-25-78-78-25 78-25z"/>
    </svg>
  ),
  de: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5 3" width="20" height="15">
      <rect width="5" height="3" y="0" x="0" fill="#000"/>
      <rect width="5" height="2" y="1" x="0" fill="#D00"/>
      <rect width="5" height="1" y="2" x="0" fill="#FFCE00"/>
    </svg>
  ),
  bg: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 360" width="20" height="15">
      <rect width="600" height="360" fill="#fff"/>
      <rect width="600" height="240" y="120" fill="#00966E"/>
      <rect width="600" height="120" y="240" fill="#D62612"/>
    </svg>
  )
};

export default function LanguageSwitcher() {
  const locale = useLocale() as keyof typeof Flags;
  const router = useRouter();
  const pathname = usePathname();

  const handleValueChange = (nextLocale: string) => {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <Select defaultValue={locale} onValueChange={handleValueChange}>
      <SelectTrigger className="w-[80px] h-9 border-none shadow-none bg-transparent focus:ring-0 px-2">
        <SelectValue placeholder="Lang">
             <div className="flex items-center gap-2">
                {Flags[locale] || Flags['en']}
                <span className="uppercase text-xs font-bold text-slate-700">{locale}</span>
             </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end" className="min-w-[120px]">
        <SelectItem value="en">
            <div className="flex items-center gap-3">
                {Flags['en']} <span className="text-sm">English</span>
            </div>
        </SelectItem>
        <SelectItem value="tr">
            <div className="flex items-center gap-3">
                {Flags['tr']} <span className="text-sm">Türkçe</span>
            </div>
        </SelectItem>
        <SelectItem value="de">
            <div className="flex items-center gap-3">
                {Flags['de']} <span className="text-sm">Deutsch</span>
            </div>
        </SelectItem>
        <SelectItem value="bg">
            <div className="flex items-center gap-3">
                {Flags['bg']} <span className="text-sm">Български</span>
            </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}