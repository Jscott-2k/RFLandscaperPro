import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersModule } from './customers/customers.module';
import { JobsModule } from './jobs/jobs.module';

const logger = new Logger('TypeORM');

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const isProduction = config.get<string>('NODE_ENV') === 'production';
    logger.log(`Connecting to DB in ${isProduction ? 'production' : 'development'} mode`);
    return {
      type: 'postgres',
      host: config.get<string>('DB_HOST'),
      port: Number(config.get('DB_PORT')) || 5432,
      username: config.get<string>('DB_USERNAME'),
      password: config.get<string>('DB_PASSWORD'),
      database: config.get<string>('DB_NAME'),
      autoLoadEntities: true,
      synchronize: !isProduction,
      ssl: isProduction
        ? {
            rejectUnauthorized: false,
          }
        : false,
    };
  },
}),


    CustomersModule,
    JobsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
