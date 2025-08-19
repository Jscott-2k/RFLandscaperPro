import { PartialType } from '@nestjs/mapped-types';
import { CreateJobDto } from './create-job.dto';

// Extends CreateJobDto with all fields optional
export class UpdateJobDto extends PartialType(CreateJobDto) {}
