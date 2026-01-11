import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation'; // <-- DÜZELTİLDİ

export const routing = defineRouting({
  // Desteklenen diller
  locales: ['en', 'bg', 'tr', 'de'],
  
  // Varsayılan dil
  defaultLocale: 'en'
});

// BURASI GÜNCELLENDİ: 'createSharedPathnamesNavigation' yerine 'createNavigation'
export const {Link, redirect, usePathname, useRouter} =
  createNavigation(routing);