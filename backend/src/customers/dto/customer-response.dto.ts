import { Job } from '../../jobs/entities/job.entity';

export class AddressResponseDto {
  id: number;
  street: string;
  city: string;
  state: string;
  zip: string;
}

export class CustomerResponseDto {
  id: number;
  name: string;
  email: string;
  addresses: AddressResponseDto[];
  jobs?: Partial<Job>[];
  createdAt: Date;
  updatedAt: Date;
}
