import { type SendMailOptions } from 'nodemailer';

export function passwordResetMail(to: string, token: string): SendMailOptions {
  return {
    html: `<p>Your password reset token is: <strong>${token}</strong></p>`,
    subject: 'Password Reset Request',
    text: `Your password reset token is: ${token}`,
    to,
  };
}
