import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

const transports: winston.transport[] = [
  new winston.transports.Console(),
  new winston.transports.File({ filename: 'app.log' }),
];

if (process.env.REMOTE_LOG_HOST) {
  transports.push(
    new winston.transports.Http({
      host: process.env.REMOTE_LOG_HOST,
      port: process.env.REMOTE_LOG_PORT
        ? Number(process.env.REMOTE_LOG_PORT)
        : 1234,
      path: process.env.REMOTE_LOG_PATH || '/',
    }),
  );
}

export const LoggerModule = WinstonModule.forRoot({
  level: process.env.LOG_LEVEL || 'info',
  transports,
});
