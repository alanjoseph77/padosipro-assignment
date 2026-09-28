import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
});

export async function sendOtpEmail(to: string, code: string) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: "Your PadosiPro verification code",
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
    html: `<p>Your verification code is</p><h2 style="letter-spacing:4px">${code}</h2><p>It expires in 10 minutes.</p>`,
  });
}