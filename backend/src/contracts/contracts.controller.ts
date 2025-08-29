import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { ContractResponseDto } from './dto/contract-response.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { CompanyId } from '../common/decorators/company-id.decorator';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('contracts')
@ApiBearerAuth()
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  @Roles(UserRole.CompanyAdmin)
  @ApiOperation({ summary: 'Create contract' })
  @ApiResponse({ status: 201, type: ContractResponseDto })
  create(
    @Body() dto: CreateContractDto,
    @CompanyId() companyId: number,
  ): Promise<ContractResponseDto> {
    return this.contractsService.create(dto, companyId);
  }

  @Get()
  @Roles(UserRole.CompanyAdmin, UserRole.Worker)
  @ApiOperation({ summary: 'List contracts' })
  @ApiResponse({ status: 200, type: [ContractResponseDto] })
  findAll(@CompanyId() companyId: number): Promise<ContractResponseDto[]> {
    return this.contractsService.findAll(companyId);
  }

  @Patch(':id')
  @Roles(UserRole.CompanyAdmin)
  @ApiOperation({ summary: 'Update contract' })
  @ApiResponse({ status: 200, type: ContractResponseDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContractDto,
    @CompanyId() companyId: number,
  ): Promise<ContractResponseDto> {
    return this.contractsService.update(id, dto, companyId);
  }

  @Post(':id/cancel')
  @Roles(UserRole.CompanyAdmin)
  @ApiOperation({ summary: 'Cancel contract' })
  @ApiResponse({ status: 200, description: 'Contract cancelled' })
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @CompanyId() companyId: number,
  ): Promise<void> {
    return this.contractsService.cancel(id, companyId);
  }
}
