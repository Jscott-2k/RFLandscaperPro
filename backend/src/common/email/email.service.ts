import type SMTPTransport from 'nodemailer/lib/smtp-transport';

import {
  Injectable,
  Logger,
  type OnModuleInit,
  type OnModuleDestroy,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';

import { EtherealTransport, SmtpTransport, type MailDriver } from './transports';

function toError(e: unknown): Error {
  return e instanceof Error
    ? e
    : new Error(typeof e === 'string' ? e : JSON.stringify(e));
}

@Injectable()
export class EmailService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailService.name);
  private transporter!: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;
  private testAccount?: nodemailer.TestAccount;
  private driver!: MailDriver;

  private readyResolve!: () => void;
  private readonly ready = new Promise<void>(
    (resolve) => (this.readyResolve = resolve),
  );

  async onModuleInit(): Promise<void> {
    const emailEnabled =
      process.env.EMAIL_ENABLED !== 'false' &&
      process.env.EMAIL_ENABLED !== '0';
    if (!emailEnabled) {
      this.logger.log('EmailService disabled via EMAIL_ENABLED');
      this.readyResolve();
      return;
    }

    const hasMailhog = Boolean(process.env.MAILHOG_HOST) || Boolean(process.env.MAILHOG_PORT);
    this.driver =
      process.env.NODE_ENV === 'production'
        ? 'smtp'
        : hasMailhog
          ? 'smtp'
          : process.env.SMTP_USER && process.env.SMTP_PASS
            ? 'smtp'
            : 'ethereal';
    this.logger.log(`Initializing EmailService with driver: ${this.driver}`);

    if (this.driver === 'smtp') {
      const { transporter } = await new SmtpTransport().create();
      this.transporter = transporter;
      try {
        await Promise.race([
          this.transporter.verify(),
          new Promise<never>((_resolve, reject) =>
            setTimeout(() => reject(new Error('SMTP verify timeout')), 5000),
          ),
        ]);
        this.logger.log('SMTP transporter verified.');
      } catch (e) {
        const err = toError(e);
        if (process.env.NODE_ENV !== 'production') {
          this.logger.warn(
            `SMTP verify failed or timed out: ${err.message}. Falling back to ethereal.`,
          );
          const ethereal = await new EtherealTransport().create();
          this.transporter = ethereal.transporter;
          this.testAccount = ethereal.testAccount;
          this.driver = 'ethereal';
        } else {
          this.logger.warn(
            `SMTP verify failed or timed out (will still try to send): ${err.message}`,
          );
        }
      }
    } else {
      const ethereal = await new EtherealTransport().create();
      this.transporter = ethereal.transporter;
      this.testAccount = ethereal.testAccount;
    }

    this.readyResolve();
  }

  onModuleDestroy(): void {
    this.transporter?.close?.();
  }

  private formatRecipients(to: nodemailer.SendMailOptions['to']): string {
    const extract = (address: string | { address: string }): string =>
      typeof address === 'string' ? address : address.address;
    if (!to) {return 'unknown';}
    return Array.isArray(to) ? to.map(extract).join(', ') : extract(to);
  }

  async send(
    options: nodemailer.SendMailOptions,
  ): Promise<{ messageId: string; previewUrl?: string }> {
    await this.ready;

    const from =
      process.env.EMAIL_FROM ??
      (this.testAccount?.user
        ? `RF Landscaper Pro <${this.testAccount.user}>`
        : 'RF Landscaper Pro <no-reply@rflandscaperpro.com>');

    try {
      const mailOptions = {
        from,
        ...options,
      } satisfies nodemailer.SendMailOptions;
      const info = await this.transporter.sendMail(mailOptions);

      const recipients = this.formatRecipients(options.to);
      this.logger.log(`Email sent to ${recipients} (id: ${info.messageId})`);

      let previewUrl: string | undefined;
      if (this.driver === 'ethereal') {
        const url = nodemailer.getTestMessageUrl(info);
        previewUrl = typeof url === 'string' ? url : undefined;
        if (previewUrl) {this.logger.log(`Preview URL: ${previewUrl}`);}
      }

      return { messageId: info.messageId, previewUrl };
    } catch (e) {
      const err = toError(e);
      const recipients = this.formatRecipients(options.to);
      this.logger.error(
        `Failed to send email to ${recipients}: ${err.message}`,
      );
      throw err;
    }
  }
}
