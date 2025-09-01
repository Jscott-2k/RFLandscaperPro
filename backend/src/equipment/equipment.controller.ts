import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  ParseEnumPipe,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CompanyId } from '../common/decorators/company-id.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { type PaginationParams, type Paginated } from '../common/pagination';
import { UserRole } from '../users/user.entity';
import { type CreateEquipmentDto } from './dto/create-equipment.dto';
import { EquipmentResponseDto } from './dto/equipment-response.dto';
import { type UpdateEquipmentStatusDto } from './dto/update-equipment-status.dto';
import { type UpdateEquipmentDto } from './dto/update-equipment.dto';
import { EquipmentStatus, EquipmentType } from './entities/equipment.entity';
import { EquipmentService } from './equipment.service';

@ApiTags('equipment')
@ApiBearerAuth()
@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Post()
  @Roles(UserRole.CompanyAdmin, UserRole.Worker)
  @ApiOperation({ summary: 'Create equipment' })
  @ApiResponse({
    description: 'Equipment created',
    status: 201,
    type: EquipmentResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async create(
    @Body() createEquipmentDto: CreateEquipmentDto,
    @CompanyId() companyId: number,
  ): Promise<EquipmentResponseDto> {
    return this.equipmentService.create(createEquipmentDto, companyId);
  }

  @Get()
  @Roles(UserRole.CompanyAdmin, UserRole.Worker, UserRole.Customer)
  @ApiOperation({ summary: 'List equipment for the authenticated company' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false, type: Number })
  @ApiQuery({ enum: EquipmentStatus, name: 'status', required: false })
  @ApiQuery({ enum: EquipmentType, name: 'type', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ description: 'List of equipment', status: 200 })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findAll(
    @Query() pagination: PaginationParams,
    @CompanyId() companyId: number,
    @Query('status', new ParseEnumPipe(EquipmentStatus, { optional: true }))
    status?: EquipmentStatus,
    @Query('type', new ParseEnumPipe(EquipmentType, { optional: true }))
    type?: EquipmentType,
    @Query('search') search?: string,
  ): Promise<Paginated<EquipmentResponseDto>> {
    return this.equipmentService.findAll(
      pagination,
      companyId,
      status,
      type,
      search,
    );
  }

  @Get(':id')
  @Roles(UserRole.CompanyAdmin, UserRole.Worker, UserRole.Customer)
  @ApiOperation({ summary: 'Get equipment by id' })
  @ApiResponse({
    description: 'Equipment retrieved',
    status: 200,
    type: EquipmentResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CompanyId() companyId: number,
  ): Promise<EquipmentResponseDto> {
    return this.equipmentService.findOne(id, companyId);
  }

  @Patch(':id')
  @Roles(UserRole.CompanyAdmin, UserRole.Worker)
  @ApiOperation({ summary: 'Update equipment' })
  @ApiResponse({
    description: 'Equipment updated',
    status: 200,
    type: EquipmentResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEquipmentDto: UpdateEquipmentDto,
    @CompanyId() companyId: number,
  ): Promise<EquipmentResponseDto> {
    return this.equipmentService.update(id, updateEquipmentDto, companyId);
  }

  @Patch(':id/status')
  @Roles(UserRole.CompanyAdmin, UserRole.Worker)
  @ApiOperation({ summary: 'Update equipment status' })
  @ApiResponse({
    description: 'Equipment status updated',
    status: 200,
    type: EquipmentResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEquipmentStatusDto: UpdateEquipmentStatusDto,
    @CompanyId() companyId: number,
  ): Promise<EquipmentResponseDto> {
    return this.equipmentService.updateStatus(
      id,
      updateEquipmentStatusDto.status,
      companyId,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.CompanyAdmin, UserRole.Worker)
  @ApiOperation({ summary: 'Delete equipment' })
  @ApiResponse({ description: 'Equipment deleted', status: 204 })
  @ApiBadRequestResponse({ description: 'Bad Request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CompanyId() companyId: number,
  ): Promise<void> {
    await this.equipmentService.remove(id, companyId);
  }
}
