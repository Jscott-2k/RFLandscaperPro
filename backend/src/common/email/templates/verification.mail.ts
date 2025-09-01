import { type SendMailOptions } from 'nodemailer';

export function verificationMail(to: string, token: string): SendMailOptions {
  return {
    html: `<p>Your verification token is: <strong>${token}</strong></p>`,
    subject: 'Verify your email',
    text: `Your verification token is: ${token}`,
    to,
  };
}
