import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

type MailDriver = 'smtp' | 'ethereal';

function parsePort(v: string | undefined, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

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
    (res) => (this.readyResolve = res),
  );

  async onModuleInit(): Promise<void> {
    this.driver =
      process.env.NODE_ENV === 'production'
        ? 'smtp'
        : process.env.SMTP_USER && process.env.SMTP_PASS
          ? 'smtp'
          : 'ethereal';
    this.logger.log(`Initializing EmailService with driver: ${this.driver}`);

    if (this.driver === 'ethereal') {
      // Fall back to an Ethereal test account when no SMTP credentials are provided
      this.testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: this.testAccount.user,
          pass: this.testAccount.pass,
        },
      });
    } else {
      const port = parsePort(process.env.SMTP_PORT, 587);
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: port === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      try {
        await this.transporter.verify();
        this.logger.log('SMTP transporter verified.');
      } catch (e) {
        const err = toError(e);
        if (process.env.NODE_ENV !== 'production') {
          this.logger.warn(
            `SMTP verify failed: ${err.message}. Falling back to ethereal.`,
          );
          this.testAccount = await nodemailer.createTestAccount();
          this.transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
              user: this.testAccount.user,
              pass: this.testAccount.pass,
            },
          });
          this.driver = 'ethereal';
        } else {
          this.logger.warn(
            `SMTP verify failed (will still try to send): ${err.message}`,
          );
        }
      }
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

  private async sendMail(
    options: nodemailer.SendMailOptions,
  ): Promise<{ messageId: string; previewUrl?: string }> {
    await this.ready;

    const from =
      process.env.SMTP_FROM ??
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

  async sendPasswordResetEmail(
    to: string,
    token: string,
  ): Promise<{ messageId: string; previewUrl?: string }> {
    return this.sendMail({
      to,
      subject: 'Password Reset Request',
      text: `Your password reset token is: ${token}`,
      html: `<p>Your password reset token is: <strong>${token}</strong></p>`,
    });
  }

  async sendVerificationEmail(
    to: string,
    token: string,
  ): Promise<{ messageId: string; previewUrl?: string }> {
    return this.sendMail({
      to,
      subject: 'Verify your email',
      text: `Your verification token is: ${token}`,
      html: `<p>Your verification token is: <strong>${token}</strong></p>`,
    });
  }

  async sendWelcomeEmail(
    to: string,
    username: string,
  ): Promise<{ messageId: string; previewUrl?: string }> {
    return this.sendMail({
      to,
      subject: 'Welcome to RF Landscaper Pro',
      text: `Welcome ${username}!`,
      html: `<p>Welcome <strong>${username}</strong>!</p>`,
    });
  }

  async sendJobAssignmentNotification(
    to: string,
    jobTitle: string,
  ): Promise<{ messageId: string; previewUrl?: string }> {
    return this.sendMail({
      to,
      subject: 'Job Assignment Notification',
      text: `You have been assigned to job: ${jobTitle}`,
      html: `<p>You have been assigned to job: <strong>${jobTitle}</strong></p>`,
    });
  }
}
