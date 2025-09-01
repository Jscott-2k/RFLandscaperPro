import { type CustomerResponseDto } from './dto/customer-response.dto';
import { type Customer } from './entities/customer.entity';

export function toCustomerResponseDto(customer: Customer): CustomerResponseDto {
  return {
    active: customer.active,
    addresses: customer.addresses?.map((addr) => ({
      city: addr.city,
      id: addr.id,
      notes: addr.notes,
      primary: addr.primary,
      state: addr.state,
      street: addr.street,
      unit: addr.unit,
      zip: addr.zip,
    })),
    createdAt: customer.createdAt,
    email: customer.email,
    id: customer.id,
    jobs: customer.jobs?.map((job) => ({
      id: job.id,
      title: job.title,
    })),
    name: customer.name,
    notes: customer.notes,
    phone: customer.phone,
    updatedAt: customer.updatedAt,
    userId: customer.userId,
  };
}
