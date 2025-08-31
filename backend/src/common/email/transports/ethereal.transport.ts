import { Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EmailTransport, MailDriver } from './transport.interface';

function toError(e: unknown): Error {
  return e instanceof Error
    ? e
    : new Error(typeof e === 'string' ? e : JSON.stringify(e));
}

export class EtherealTransport implements EmailTransport {
  driver: MailDriver = 'ethereal';
  private readonly logger = new Logger(EtherealTransport.name);

  async create() {
    try {
      const testAccount = await Promise.race([
        nodemailer.createTestAccount(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Ethereal test account timeout')), 5000),
        ),
      ]);
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
    } catch (e) {
      const err = toError(e);
      this.logger.warn(
        `Failed to create ethereal test account: ${err.message}. Using no-op transport.`,
      );
      const transporter = nodemailer.createTransport({ jsonTransport: true });
      return { transporter };
    }
  }
}
