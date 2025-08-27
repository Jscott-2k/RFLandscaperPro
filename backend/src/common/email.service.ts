import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter!: nodemailer.Transporter;
  private testAccount?: nodemailer.TestAccount;
  private readonly ready: Promise<void>;

  constructor() {
    if (process.env.NODE_ENV === 'production') {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      this.ready = Promise.resolve();
    } else {
      this.ready = nodemailer
        .createTestAccount()
        .then((account: nodemailer.TestAccount) => {
          this.testAccount = account;
          this.transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
              user: account.user,
              pass: account.pass,
            },
          });
        });
    }
  }

  private formatRecipients(to: nodemailer.SendMailOptions['to']): string {
    const extract = (address: string | { address: string }): string =>
      typeof address === 'string' ? address : address.address;
    if (!to) return 'unknown';
    return Array.isArray(to) ? to.map(extract).join(', ') : extract(to);
  }

  private async sendMail(options: nodemailer.SendMailOptions): Promise<void> {
    await this.ready;
    try {
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || this.testAccount?.user,
        ...options,
      });
      const recipients = this.formatRecipients(options.to);
      this.logger.log(`Email sent to ${recipients}`);
      if (process.env.NODE_ENV !== 'production') {
        const url = nodemailer.getTestMessageUrl(info);
        if (url) this.logger.log(`Preview URL: ${url}`);
      }
    } catch (error: unknown) {
      const recipients = this.formatRecipients(options.to);
      this.logger.error(`Failed to send email to ${recipients}:`, error);
    }
  }

  async sendPasswordResetEmail(username: string, token: string): Promise<void> {
    await this.sendMail({
      to: username,
      subject: 'Password Reset Request',
      text: `Your password reset token is: ${token}`,
    });
  }

  async sendWelcomeEmail(username: string, email: string): Promise<void> {
    await this.sendMail({
      to: email,
      subject: 'Welcome to RF Landscaper Pro',
      text: `Welcome ${username}!`,
    });
  }

  async sendJobAssignmentNotification(
    username: string,
    jobTitle: string,
  ): Promise<void> {
    await this.sendMail({
      to: username,
      subject: 'Job Assignment Notification',
      text: `You have been assigned to job: ${jobTitle}`,
    });
  }
}
