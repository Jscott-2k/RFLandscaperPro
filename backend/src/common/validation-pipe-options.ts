import { type ValidationPipeOptions } from '@nestjs/common';

// Shared ValidationPipe options to keep application and tests aligned
export const validationPipeOptions: ValidationPipeOptions = {
  errorHttpStatusCode: 422,
  forbidNonWhitelisted: true,
  stopAtFirstError: true,
  transform: true,
  transformOptions: { enableImplicitConversion: true },
  whitelist: true,
};

