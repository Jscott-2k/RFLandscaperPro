import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExceptionFilter, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception/http-exception.filter';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  logger.log(`Starting backend in ${process.env.NODE_ENV || 'development'} mode`);
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  app.useGlobalFilters(new HttpExceptionFilter() satisfies ExceptionFilter);
  await app.listen(process.env.PORT || 3000, '0.0.0.0');
}
bootstrap().catch((error) => {
  console.error('Bootstrap error:', error);
  process.exit(1);
});
