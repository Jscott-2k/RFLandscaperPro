import { Job } from 'src/jobs/entities/job.entity';

export class CustomerResponseDto {
  id: number;
  name: string;
  email: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
  jobs?: Partial<Job>[];
}
