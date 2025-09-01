import * as nodemailer from 'nodemailer';

import { type EmailTransport, type MailDriver } from './transport.interface';

function parsePort(v: string | undefined, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export class SmtpTransport implements EmailTransport {
  driver: MailDriver = 'smtp';

  create() {
    const host = process.env.MAILHOG_HOST ?? process.env.SMTP_HOST;
    const isMailhog = Boolean(process.env.MAILHOG_HOST);
    const port = parsePort(
      isMailhog ? process.env.MAILHOG_PORT : process.env.SMTP_PORT,
      isMailhog ? 1025 : 587,
    );
    const auth =
      isMailhog || !process.env.SMTP_USER || !process.env.SMTP_PASS
        ? undefined
        : {
            pass: process.env.SMTP_PASS,
            user: process.env.SMTP_USER,
          };
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      ...(auth ? { auth } : {}),
    });
    return Promise.resolve({ transporter });
  }
}
