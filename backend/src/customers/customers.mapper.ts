import { Customer } from './entities/customer.entity';
import { CustomerResponseDto } from './dto/customer-response.dto';

export function toCustomerResponseDto(customer: Customer): CustomerResponseDto {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    notes: customer.notes,
    active: customer.active,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
    userId: customer.userId,
    jobs: customer.jobs?.map((job) => ({
      id: job.id,
      title: job.title,
    })),
    addresses: customer.addresses?.map((addr) => ({
      id: addr.id,
      street: addr.street,
      city: addr.city,
      state: addr.state,
      zip: addr.zip,
      unit: addr.unit,
      notes: addr.notes,
      primary: addr.primary,
    })),
  };
}
