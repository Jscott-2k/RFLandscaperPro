import { type ContractResponseDto } from './dto/contract-response.dto';
import { type Contract } from './entities/contract.entity';

export function toContractResponseDto(contract: Contract): ContractResponseDto {
  return {
    active: contract.active,
    customer: {
      email: contract.customer.email,
      id: contract.customer.id,
      name: contract.customer.name,
    },
    endDate: contract.endDate,
    frequency: contract.frequency,
    id: contract.id,
    jobTemplate: contract.jobTemplate,
    lastGeneratedDate: contract.lastGeneratedDate,
    occurrencesGenerated: contract.occurrencesGenerated,
    startDate: contract.startDate,
    totalOccurrences: contract.totalOccurrences,
  };
}
