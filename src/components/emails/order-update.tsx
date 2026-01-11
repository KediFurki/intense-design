import * as React from "react";
import {
  Html, Body, Head, Container, Preview, Section, Text, Button, Heading, Tailwind
} from "@react-email/components";
import { Tailwind as TailwindWrapper } from "@react-email/tailwind";

interface OrderUpdateEmailProps {
  orderId: string;
  customerName: string;
  newStatus: string;
}

export const OrderUpdateEmail = ({
  orderId,
  customerName,
  newStatus,
}: OrderUpdateEmailProps) => {
  
  // Duruma göre mesaj
  const getStatusMessage = (status: string) => {
    switch (status) {
        case "processing": return "Siparişiniz şu anda hazırlanıyor.";
        case "shipped": return "Harika haber! Siparişiniz kargoya verildi 🚚";
        case "delivered": return "Siparişiniz teslim edildi. Bizi tercih ettiğiniz için teşekkürler!";
        case "cancelled": return "Siparişiniz iptal edildi.";
        default: return `Sipariş durumunuz güncellendi: ${status}`;
    }
  };

  const message = getStatusMessage(newStatus);

  return (
    <Html>
      <Head />
      <Preview>Sipariş Güncellemesi: {newStatus}</Preview>
      <TailwindWrapper>
        <Body className="bg-white font-sans my-auto mx-auto px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            <Section className="text-center mt-[32px]">
              <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                Instant<span className="text-blue-600 font-bold">Design</span>
              </Heading>
            </Section>

            <Section className="text-center">
              <Text className="text-black text-[14px] leading-[24px]">
                Merhaba <strong>{customerName}</strong>,
              </Text>
              
              <div className="bg-blue-50 border border-blue-100 rounded p-4 my-4">
                 <Heading className="text-blue-800 text-[18px] font-bold m-0 mb-2 capitalize">
                    {newStatus.toUpperCase()}
                 </Heading>
                 <Text className="text-gray-600 text-[14px] m-0">
                    {message}
                 </Text>
              </div>

              <Text className="text-gray-500 text-[12px] mb-6">
                Sipariş No: #{orderId.slice(0, 8)}
              </Text>

              <Button 
                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href="http://localhost:3000/account" 
              >
                Siparişi Takip Et
              </Button>
            </Section>
          </Container>
        </Body>
      </TailwindWrapper>
    </Html>
  );
};

export default OrderUpdateEmail;