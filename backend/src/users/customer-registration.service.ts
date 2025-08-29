import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Customer } from '../customers/entities/customer.entity';
import { User } from './user.entity';

@Injectable()
export class CustomerRegistrationService {
  async register(user: User, manager: EntityManager) {
    const customerRepository = manager.getRepository(Customer);
    const customer = customerRepository.create({
      name: user.username,
      email: user.email.value,
      userId: user.id,
    });
    return customerRepository.save(customer);
  }
}
