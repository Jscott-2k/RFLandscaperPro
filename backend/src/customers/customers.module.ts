import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { Customer } from './entities/customer.entity';
import { Address } from './entities/address.entity';
import {
  CustomerRepository,
  CUSTOMER_REPOSITORY,
} from './repositories/customer.repository';

const customerRepositoryProvider = {
  provide: CUSTOMER_REPOSITORY,
  useClass: CustomerRepository,
};

@Module({
  imports: [TypeOrmModule.forFeature([Customer, Address])],
  controllers: [CustomersController],
  providers: [CustomersService, customerRepositoryProvider],
  exports: [CustomersService, customerRepositoryProvider],
})
export class CustomersModule {}
