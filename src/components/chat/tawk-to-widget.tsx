"use client";

import Script from "next/script";

export default function TawkToWidget({ locale }: { locale: string }) {
  const widgetIds: Record<string, string> = {
    en: "1jku0fmm0",
    tr: "1jku0d82b",
    de: "1jku0f33o",
    bg: "1jku0gjt4",
  };
  const currentWidgetId = widgetIds[locale] || widgetIds.en;

  return (
    <Script
      id="tawk-to"
      strategy="lazyOnload"
      dangerouslySetInnerHTML={{
        __html: `
          var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
          (function(){
          var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
          s1.async=true;
          s1.src='https://embed.tawk.to/69c9b938ff64531c3751a96f/${currentWidgetId}';
          s1.charset='UTF-8';
          s1.setAttribute('crossorigin','*');
          s0.parentNode.insertBefore(s1,s0);
          })();
        `,
      }}
    />
  );
}
