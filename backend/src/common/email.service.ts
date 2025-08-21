import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  async sendPasswordResetEmail(username: string, token: string): Promise<void> {
    // In a real application, integrate with an email provider here
    // For now, we simply log the token
    // eslint-disable-next-line no-console
    console.log(`Password reset token for ${username}: ${token}`);
  }
}
