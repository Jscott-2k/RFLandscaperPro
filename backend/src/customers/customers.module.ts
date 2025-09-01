import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { Address } from './entities/address.entity';
import { Customer } from './entities/customer.entity';
import {
  CustomerRepository,
  CUSTOMER_REPOSITORY,
} from './repositories/customer.repository';

const customerRepositoryProvider = {
  provide: CUSTOMER_REPOSITORY,
  useClass: CustomerRepository,
};

@Module({
  controllers: [CustomersController],
  exports: [CustomersService, CUSTOMER_REPOSITORY],
  imports: [TypeOrmModule.forFeature([Customer, Address])],
  providers: [CustomersService, customerRepositoryProvider],
})
export class CustomersModule {}
