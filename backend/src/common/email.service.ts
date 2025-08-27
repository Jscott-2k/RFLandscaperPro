import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  private async sendMail(
    options: nodemailer.SendMailOptions,
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        ...options,
      });
      this.logger.log(`Email sent to ${options.to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${options.to}:`,
        error,
      );
    }
  }

  async sendPasswordResetEmail(
    username: string,
    token: string,
  ): Promise<void> {
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
