import { Injectable } from '@nestjs/common';
import { type EntityManager } from 'typeorm';

import { Customer } from '../customers/entities/customer.entity';
import { type User } from './user.entity';

@Injectable()
export class CustomerRegistrationService {
  async register(user: User, manager: EntityManager) {
    const customerRepository = manager.getRepository(Customer);
    const customer = customerRepository.create({
      email: user.email.value,
      name: user.username,
      userId: user.id,
    });
    return customerRepository.save(customer);
  }
}
