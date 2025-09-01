import {
  type Job as ApiJob,
  type CreateJob as ApiCreateJob,
  type UpdateJob as ApiUpdateJob,
} from '../api/jobs-api.service';

export type Job = {
  id?: number;
  completed?: boolean;
  description?: string;
  scheduledDate?: string;
  customerId?: number;
} & Omit<ApiJob, 'id' | 'completed'>

export type CreateJob = ApiCreateJob & {
  description?: string;
  scheduledDate?: string;
  customerId?: number;
};

export type UpdateJob = ApiUpdateJob & {
  description?: string;
  scheduledDate?: string;
  customerId?: number;
};
