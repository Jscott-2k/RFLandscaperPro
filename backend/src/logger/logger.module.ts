import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

export const LoggerModule = WinstonModule.forRoot({
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'app.log' }),
    new winston.transports.Http({
      host: process.env.REMOTE_LOG_HOST || 'localhost',
      port: process.env.REMOTE_LOG_PORT
        ? Number(process.env.REMOTE_LOG_PORT)
        : 1234,
      path: process.env.REMOTE_LOG_PATH || '/',
    }),
  ],
});
