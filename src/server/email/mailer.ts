import { Resend } from "resend";
import type React from "react";

function toMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Email send failed";
}

const RESEND_API_KEY = process.env.RESEND_API_KEY;

export function getAdminEmail(): string {
  // İstersen sonra settings tablosundan da çekersin.
  // Şimdilik tek kaynak: env.
  return process.env.SUPPORT_EMAIL || "support@intensedesign.eu";
}

export function getFromEmail(): string {
  // Resend domain doğrulamasına göre bunu güncelleyeceksin.
  // Şimdilik çalışıyorsa kalsın.
  return process.env.MAIL_FROM || "Intense Design <onboarding@resend.dev>";
}

export type SendEmailArgs = {
  to: string | string[];
  subject: string;
  react?: React.ReactElement;
  html?: string;
  text?: string;
  replyTo?: string;
};

export type SendEmailResult = {
  id: string | null;
  error: string | null;
};

export async function sendEmail(args: SendEmailArgs): Promise<SendEmailResult> {
  if (!RESEND_API_KEY) {
    return { id: null, error: "RESEND_API_KEY is missing" };
  }

  const resend = new Resend(RESEND_API_KEY);

  try {
    const payload = {
      from: getFromEmail(),
      to: args.to,
      subject: args.subject,
      replyTo: args.replyTo,
      react: args.react,
      html: args.html,
      text: args.text,
    };

    // Resend SDK bazen union döndürür: {data, error}
    const result = await resend.emails.send(payload);

// result tipini güvenli şekilde oku
const hasError =
  typeof result === "object" &&
  result !== null &&
  "error" in result &&
  (result as { error?: unknown }).error;

if (hasError) {
  const err = (result as { error?: unknown }).error;
  const msg =
    typeof err === "string"
      ? err
      : (typeof err === "object" && err !== null && "message" in err
          ? String((err as { message?: unknown }).message)
          : "Resend error");
  return { id: null, error: msg };
}

const id =
  typeof result === "object" &&
  result !== null &&
  "data" in result &&
  (result as { data?: unknown }).data &&
  typeof (result as { data: { id?: unknown } }).data.id === "string"
    ? (result as { data: { id: string } }).data.id
    : null;

return { id, error: null };
  } catch (err) {
    return { id: null, error: toMessage(err) };
  }
}