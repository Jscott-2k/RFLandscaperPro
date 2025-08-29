import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import {
  EtherealTransport,
  SmtpTransport,
  MailDriver,
} from './transports';

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
  private readonly ready = new Promise<void>((res) => (this.readyResolve = res));

  async onModuleInit(): Promise<void> {
    this.driver =
      process.env.NODE_ENV === 'production'
        ? 'smtp'
        : process.env.SMTP_USER && process.env.SMTP_PASS
          ? 'smtp'
          : 'ethereal';
    this.logger.log(`Initializing EmailService with driver: ${this.driver}`);

    if (this.driver === 'smtp') {
      const { transporter } = await new SmtpTransport().create();
      this.transporter = transporter;
      try {
        await this.transporter.verify();
        this.logger.log('SMTP transporter verified.');
      } catch (e) {
        const err = toError(e);
        if (process.env.NODE_ENV !== 'production') {
          this.logger.warn(
            `SMTP verify failed: ${err.message}. Falling back to ethereal.`,
          );
          const ethereal = await new EtherealTransport().create();
          this.transporter = ethereal.transporter;
          this.testAccount = ethereal.testAccount;
          this.driver = 'ethereal';
        } else {
          this.logger.warn(
            `SMTP verify failed (will still try to send): ${err.message}`,
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
  this.transporter.close?.();
  }

  private formatRecipients(to: nodemailer.SendMailOptions['to']): string {
    const extract = (address: string | { address: string }): string =>
      typeof address === 'string' ? address : address.address;
    if (!to) return 'unknown';
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
        if (previewUrl) this.logger.log(`Preview URL: ${previewUrl}`);
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
