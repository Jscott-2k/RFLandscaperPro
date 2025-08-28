import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { ContractResponseDto } from './dto/contract-response.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
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
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Create contract' })
  @ApiResponse({ status: 201, type: ContractResponseDto })
  create(
    @Body() dto: CreateContractDto,
    @Req() req: { user: { companyId: number } },
  ): Promise<ContractResponseDto> {
    return this.contractsService.create(dto, req.user.companyId);
  }

  @Get()
  @Roles(UserRole.Admin, UserRole.Worker)
  @ApiOperation({ summary: 'List contracts' })
  @ApiResponse({ status: 200, type: [ContractResponseDto] })
  findAll(
    @Req() req: { user: { companyId: number } },
  ): Promise<ContractResponseDto[]> {
    return this.contractsService.findAll(req.user.companyId);
  }

  @Patch(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Update contract' })
  @ApiResponse({ status: 200, type: ContractResponseDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContractDto,
    @Req() req: { user: { companyId: number } },
  ): Promise<ContractResponseDto> {
    return this.contractsService.update(id, dto, req.user.companyId);
  }

  @Post(':id/cancel')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Cancel contract' })
  @ApiResponse({ status: 200, description: 'Contract cancelled' })
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: { user: { companyId: number } },
  ): Promise<void> {
    return this.contractsService.cancel(id, req.user.companyId);
  }
}
