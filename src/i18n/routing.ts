import {defineRouting} from 'next-intl/routing';
import {createSharedPathnamesNavigation} from 'next-intl/navigation';

export const routing = defineRouting({
  // Desteklenen diller
  locales: ['en', 'bg', 'tr', 'de'],
  
  // Varsayılan dil (Bulgarca olacaksa 'bg' yapabiliriz, şimdilik 'en' kalsın test için)
  defaultLocale: 'en'
});

export const {Link, redirect, usePathname, useRouter} =
  createSharedPathnamesNavigation(routing);