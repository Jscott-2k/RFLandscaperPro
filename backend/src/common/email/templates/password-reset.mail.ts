import { SendMailOptions } from 'nodemailer';

export function passwordResetMail(to: string, token: string): SendMailOptions {
  return {
    to,
    subject: 'Password Reset Request',
    text: `Your password reset token is: ${token}`,
    html: `<p>Your password reset token is: <strong>${token}</strong></p>`,
  };
}
