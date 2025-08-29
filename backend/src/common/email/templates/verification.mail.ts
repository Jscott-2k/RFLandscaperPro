import { SendMailOptions } from 'nodemailer';

export function verificationMail(to: string, token: string): SendMailOptions {
  return {
    to,
    subject: 'Verify your email',
    text: `Your verification token is: ${token}`,
    html: `<p>Your verification token is: <strong>${token}</strong></p>`,
  };
}
