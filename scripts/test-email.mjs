import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const { Resend } = await import("resend");
const r = new Resend(process.env.RESEND_API_KEY);

const from = `Intense Design <${process.env.RESEND_FROM_EMAIL}>`;
const to = process.env.RESEND_TO_ADMIN;

console.log("From:", from);
console.log("To:", to);

const res = await r.emails.send({
  from,
  to,
  subject: "Test - Email Service Check",
  html: "<div style='font-family:sans-serif;padding:20px;'><h2>Email sistemi calisiyor!</h2><p>Bu test maili basariyla gonderildi.</p></div>",
});

console.log("Result:", JSON.stringify(res, null, 2));
