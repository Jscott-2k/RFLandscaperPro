import nodemailer from 'nodemailer';
import { EmailTransport, MailDriver } from './transport.interface';

export class EtherealTransport implements EmailTransport {
  driver: MailDriver = 'ethereal';

  async create() {
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    return { transporter, testAccount };
  }
}
