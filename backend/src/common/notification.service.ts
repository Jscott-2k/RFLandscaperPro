import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Job } from '../jobs/entities/job.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      // For development/testing, output emails to console as JSON
      jsonTransport: true,
    });
  }

  async sendEmail(to: string, subject: string, text: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: 'no-reply@example.com',
        to,
        subject,
        text,
      });
      this.logger.log(`Email sent to ${to}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}`, err as Error);
    }
  }

  async sendJobReminder(job: Job): Promise<void> {
    const customer = job.customer;
    if (!customer) {
      this.logger.warn(`Job ${job.id} has no customer for notification`);
      return;
    }
    const message = `Reminder: Job "${job.title}" scheduled for ${job.scheduledDate}`;
    switch (customer.notificationPreference) {
      case 'email':
        if (customer.email) {
          await this.sendEmail(customer.email, 'Job Reminder', message);
        }
        break;
      case 'sms':
        if (customer.phone) {
          // Placeholder for SMS provider integration
          this.logger.log(`SMS to ${customer.phone}: ${message}`);
        }
        break;
      default:
        this.logger.log(`No notifications sent for customer ${customer.id}`);
    }
  }
}
