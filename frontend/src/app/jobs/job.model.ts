import {
  Job as ApiJob,
  CreateJob as ApiCreateJob,
  UpdateJob as ApiUpdateJob,
} from '../api.service';

export interface Job extends Omit<ApiJob, 'id' | 'completed'> {
  id?: number;
  completed?: boolean;
  description?: string;
  scheduledDate?: string;
  customerId?: number;
}

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
