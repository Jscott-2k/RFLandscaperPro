import { Module, Injectable } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { EmailModule, EmailService } from './';

@Injectable()
class Consumer {
  constructor(public readonly emailService: EmailService) {}
}

@Module({
  providers: [Consumer],
})
class ConsumerModule {}

describe('EmailModule global provider', () => {
  const original = process.env.EMAIL_ENABLED;

  beforeAll(() => {
    process.env.EMAIL_ENABLED = 'false';
  });

  afterAll(() => {
    process.env.EMAIL_ENABLED = original;
  });

  it('makes EmailService available without importing the module', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [EmailModule, ConsumerModule],
    }).compile();

    const consumer = moduleRef.get(Consumer);
    expect(consumer.emailService).toBeInstanceOf(EmailService);
  });
});
