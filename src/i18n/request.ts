import {getRequestConfig} from 'next-intl/server';
import {routing} from './routing';

export default getRequestConfig(async ({requestLocale}) => {
  let locale = await requestLocale;

  // DÜZELTİLDİ: 'as any' yerine doğru tip tanımlaması yapıldı.
  // Bu satır, locale değişkeninin routing.locales dizisindeki değerlerden biri gibi davranmasını sağlar.
  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});