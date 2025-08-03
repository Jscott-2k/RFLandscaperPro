import { Job } from 'src/jobs/entities/job.entity';

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
  jobs?: { id: number; title: string }[];
  createdAt: Date;
  updatedAt: Date;
}
