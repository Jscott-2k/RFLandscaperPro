import nodemailer from 'nodemailer';
import { EmailTransport, MailDriver } from './transport.interface';

function parsePort(v: string | undefined, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export class SmtpTransport implements EmailTransport {
  driver: MailDriver = 'smtp';

  create() {
    const port = parsePort(process.env.SMTP_PORT, 587);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return Promise.resolve({ transporter });
  }
}
