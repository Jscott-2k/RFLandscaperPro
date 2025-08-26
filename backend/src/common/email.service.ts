import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendPasswordResetEmail(username: string, token: string): Promise<void> {
    try {
      // Integrate with an email provider to deliver the token in production.
      // Currently logs the token for development purposes.
      this.logger.log(`Password reset token for ${username}: ${token}`);

      // Example with a hypothetical email service:
      // await this.emailProvider.send({
      //   to: username,
      //   subject: 'Password Reset Request',
      //   template: 'password-reset',
      //   context: { token, username }
      // });
      
      this.logger.log(`Password reset email sent to ${username}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${username}:`, error);
      // Don't throw error to avoid exposing internal failures to user
      // In production, you might want to queue this for retry
    }
  }

  async sendWelcomeEmail(username: string, email: string): Promise<void> {
    try {
      this.logger.log(`Welcome email sent to ${username} at ${email}`);

      // Replace log with a real welcome email implementation.
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${username}:`, error);
    }
  }

  async sendJobAssignmentNotification(username: string, jobTitle: string): Promise<void> {
    try {
      this.logger.log(`Job assignment notification sent to ${username} for job: ${jobTitle}`);

      // Replace log with a real job assignment notification implementation.
    } catch (error) {
      this.logger.error(`Failed to send job assignment notification to ${username}:`, error);
    }
  }
}
