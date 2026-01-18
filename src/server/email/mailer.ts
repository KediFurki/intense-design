import { Resend } from "resend";

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

const resend = new Resend(process.env.RESEND_API_KEY);

export function getFromEmail() {
  return process.env.EMAIL_FROM || "Intense Design <onboarding@resend.dev>";
}

export function getAdminEmail() {
  return process.env.ADMIN_EMAIL || "a.furkanakar2017@gmail.com";
}

export async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<SendEmailResult> {
  try {
    const sent = await resend.emails.send({
      from: getFromEmail(),
      to: args.to,
      subject: args.subject,
      html: args.html,
      replyTo: args.replyTo,
    });

    // Resend response: { data: { id }, error }
    if (sent.error) {
      return { ok: false, error: sent.error.message || "Failed to send email" };
    }

    const id = sent.data?.id;
    if (!id) return { ok: false, error: "Missing email id from Resend" };

    return { ok: true, id };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to send email";
    return { ok: false, error: msg };
  }
}