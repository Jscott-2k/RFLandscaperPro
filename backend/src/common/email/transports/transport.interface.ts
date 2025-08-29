import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

export type MailDriver = 'smtp' | 'ethereal';

export interface EmailTransport {
  driver: MailDriver;
  create(): Promise<{
    transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;
    testAccount?: nodemailer.TestAccount;
  }>;
}
