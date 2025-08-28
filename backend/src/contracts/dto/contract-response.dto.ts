import { ContractFrequency } from '../entities/contract.entity';

export class ContractResponseDto {
  id: number;
  startDate: Date;
  endDate?: Date;
  frequency: ContractFrequency;
  totalOccurrences?: number;
  occurrencesGenerated: number;
  jobTemplate: {
    title: string;
    description?: string;
    estimatedHours?: number;
    notes?: string;
  };
  lastGeneratedDate?: Date;
  active: boolean;
  customer: {
    id: number;
    name: string;
    email: string;
  };
}
