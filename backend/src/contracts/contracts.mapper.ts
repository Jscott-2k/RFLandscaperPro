import { Contract } from './entities/contract.entity';
import { ContractResponseDto } from './dto/contract-response.dto';

export function toContractResponseDto(contract: Contract): ContractResponseDto {
  return {
    id: contract.id,
    startDate: contract.startDate,
    endDate: contract.endDate,
    frequency: contract.frequency,
    totalOccurrences: contract.totalOccurrences,
    occurrencesGenerated: contract.occurrencesGenerated,
    jobTemplate: contract.jobTemplate,
    lastGeneratedDate: contract.lastGeneratedDate,
    active: contract.active,
    customer: {
      id: contract.customer.id,
      name: contract.customer.name,
      email: contract.customer.email,
    },
  };
}
