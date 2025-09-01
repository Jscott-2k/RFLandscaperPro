import type * as nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

export type MailDriver = 'smtp' | 'ethereal';

export type EmailTransport = {
  create(): Promise<{
    transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;
    testAccount?: nodemailer.TestAccount;
  }>;
  driver: MailDriver;
}
