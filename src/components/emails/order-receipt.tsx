import * as React from "react";
import {
  Html, Body, Head, Container, Preview, Section, Text, Button, Hr, Row, Column, Heading
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";

// 1. DİL SÖZLÜĞÜ (i18n Dictionary)
const translations = {
  en: {
    subject: "Order Received",
    greeting: "Hi",
    message: "Thank you for your order! We are getting your furniture ready.",
    orderId: "Order ID",
    date: "Date",
    shipping: "Shipping Details",
    summary: "Order Summary",
    subtotal: "Subtotal",
    vat: "VAT",
    total: "Total",
    btn: "View Order",
    qty: "Qty",
    free: "Free"
  },
  tr: {
    subject: "Siparişiniz Alındı",
    greeting: "Merhaba",
    message: "Siparişiniz başarıyla alındı! Ürünlerinizi hazırlamaya başladık.",
    orderId: "Sipariş No",
    date: "Tarih",
    shipping: "Teslimat Adresi",
    summary: "Sipariş Özeti",
    subtotal: "Ara Toplam",
    vat: "KDV",
    total: "Genel Toplam",
    btn: "Siparişi Görüntüle",
    qty: "Adet",
    free: "Ücretsiz"
  },
  de: {
    subject: "Bestellung erhalten",
    greeting: "Hallo",
    message: "Vielen Dank für Ihre Bestellung! Wir bereiten Ihre Möbel vor.",
    orderId: "Bestell-Nr",
    date: "Datum",
    shipping: "Lieferadresse",
    summary: "Bestellübersicht",
    subtotal: "Zwischensumme",
    vat: "MwSt",
    total: "Gesamt",
    btn: "Bestellung ansehen",
    qty: "Menge",
    free: "Kostenlos"
  },
  bg: {
    subject: "Поръчката е получена",
    greeting: "Здравейте",
    message: "Благодарим ви за поръчката! Подготвяме вашите мебели.",
    orderId: "ID на поръчка",
    date: "Дата",
    shipping: "Адрес за доставка",
    summary: "Обобщение",
    subtotal: "Междинна сума",
    vat: "ДДС",
    total: "Общо",
    btn: "Преглед на поръчката",
    qty: "К-во",
    free: "Безплатно"
  }
};

type Locale = "en" | "tr" | "de" | "bg";

interface OrderReceiptEmailProps {
  orderId: string;
  date: Date;
  customerName: string;
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
  shippingAddress: { address: string; city: string; country: string; zipCode: string };
  locale?: Locale; // <-- Dil seçeneği buraya geliyor
}

export const OrderReceiptEmail = ({
  orderId,
  date,
  customerName,
  items,
  totalAmount,
  shippingAddress,
  locale = "en", // Varsayılan İngilizce
}: OrderReceiptEmailProps) => {
  
  // Seçilen dile göre metinleri al, yoksa İngilizce kullan
  const t = translations[locale] || translations.en;
  
  // Tarihi o ülkenin formatına göre yaz (Örn: 10 Ocak 2026)
  const formattedDate = new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(date);
  const totalEuro = totalAmount / 100;
  const vatAmount = totalEuro * 0.20;
  const subTotal = totalEuro - vatAmount;

  return (
    <Html>
      <Head />
      <Preview>{t.subject} #{orderId.slice(0, 8)}</Preview>
      <Tailwind>
        <Body className="bg-white font-sans my-auto mx-auto px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            <Section className="mt-[32px] text-center">
              <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                Instant<span className="text-blue-600 font-bold">Design</span>
              </Heading>
            </Section>

            <Section>
              <Text className="text-black text-[14px] leading-[24px]">
                {t.greeting} <strong>{customerName}</strong>,
              </Text>
              <Text className="text-black text-[14px] leading-[24px]">
                {t.message}
              </Text>
              <Text className="text-gray-500 text-[12px]">
                {t.orderId}: <strong>#{orderId.slice(0, 8)}</strong> <br/>
                {t.date}: {formattedDate}
              </Text>
            </Section>

            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

            <Section>
              <Text className="text-gray-500 text-[12px] font-bold uppercase tracking-wider mb-4">{t.summary}</Text>
              {items.map((item, index) => (
                <Row key={index} className="pb-2">
                  <Column>
                    <Text className="m-0 text-[14px] font-medium">{item.name}</Text>
                    <Text className="m-0 text-[12px] text-gray-500">{t.qty}: {item.quantity}</Text>
                  </Column>
                  <Column align="right">
                    <Text className="m-0 text-[14px] font-medium">€{((item.price * item.quantity) / 100).toFixed(2)}</Text>
                  </Column>
                </Row>
              ))}
            </Section>

            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

            <Section>
              <Row>
                <Column className="w-1/2 align-top">
                  <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-2">{t.shipping}</Text>
                  <Text className="text-[12px] text-gray-800 leading-relaxed m-0">
                    {shippingAddress.address}<br />
                    {shippingAddress.zipCode} {shippingAddress.city}<br />
                    {shippingAddress.country}
                  </Text>
                </Column>
                <Column className="w-1/2 align-top text-right">
                    <Row className="mb-1">
                        <Column><Text className="text-gray-500 text-[10px] m-0">{t.subtotal}</Text></Column>
                        <Column align="right"><Text className="text-gray-800 text-[10px] m-0">€{subTotal.toFixed(2)}</Text></Column>
                    </Row>
                    <Row className="mb-1">
                        <Column><Text className="text-gray-500 text-[10px] m-0">{t.vat} (20%)</Text></Column>
                        <Column align="right"><Text className="text-gray-800 text-[10px] m-0">€{vatAmount.toFixed(2)}</Text></Column>
                    </Row>
                    <Hr className="border-gray-100 my-2"/>
                    <Row>
                        <Column><Text className="text-[14px] font-bold text-black m-0">{t.total}</Text></Column>
                        <Column align="right"><Text className="text-[14px] font-bold text-blue-600 m-0">€{totalEuro.toFixed(2)}</Text></Column>
                    </Row>
                </Column>
              </Row>
            </Section>

            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href="http://localhost:3000/account"
              >
                {t.btn}
              </Button>
            </Section>
            
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default OrderReceiptEmail;