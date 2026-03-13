"use server";

import { sendEmail } from "@/server/email/mailer";

type CustomRequestInput = {
  productName: string;
  customerName: string;
  email: string;
  phone: string;
  message: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendCustomRequest({
  productName,
  customerName,
  email,
  phone,
  message,
}: CustomRequestInput) {
  const adminEmail = process.env.RESEND_TO_ADMIN;

  if (!adminEmail) {
    return { success: false, error: "Admin email is not configured" };
  }

  const result = await sendEmail({
    to: adminEmail,
    subject: `Custom request for ${productName}`,
    replyTo: email,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:640px;margin:0 auto;padding:24px;">
        <h1 style="font-size:20px;margin:0 0 16px;">New custom product request</h1>
        <p style="margin:0 0 12px;"><strong>Product:</strong> ${escapeHtml(productName)}</p>
        <p style="margin:0 0 12px;"><strong>Name:</strong> ${escapeHtml(customerName)}</p>
        <p style="margin:0 0 12px;"><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p style="margin:0 0 12px;"><strong>Phone:</strong> ${escapeHtml(phone)}</p>
        <div style="margin-top:20px;padding:16px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;">
          <strong>Request details</strong>
          <p style="margin:12px 0 0;white-space:pre-wrap;">${escapeHtml(message)}</p>
        </div>
      </div>
    `,
  });

  if (!result.ok) {
    return { success: false, error: result.error };
  }

  return { success: true };
}