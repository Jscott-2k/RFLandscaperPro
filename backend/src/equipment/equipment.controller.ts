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
  Req,
} from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { EquipmentResponseDto } from './dto/equipment-response.dto';
import { UpdateEquipmentStatusDto } from './dto/update-equipment-status.dto';
import { EquipmentStatus, EquipmentType } from './entities/equipment.entity';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('equipment')
@ApiBearerAuth()
@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Post()
  @Roles(UserRole.Admin, UserRole.Worker)
  @ApiOperation({ summary: 'Create equipment' })
  @ApiResponse({
    status: 201,
    description: 'Equipment created',
    type: EquipmentResponseDto,
  })
  async create(
    @Body() createEquipmentDto: CreateEquipmentDto,
    @Req() req: { user: { companyId: number } },
  ): Promise<EquipmentResponseDto> {
    return this.equipmentService.create(
      createEquipmentDto,
      req.user.companyId,
    );
  }

  @Get()
  @Roles(UserRole.Admin, UserRole.Worker, UserRole.Customer)
  @ApiOperation({ summary: 'List equipment' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false, enum: EquipmentStatus })
  @ApiQuery({ name: 'type', required: false, enum: EquipmentType })
  @ApiResponse({ status: 200, description: 'List of equipment' })
  async findAll(
    @Query() pagination: PaginationQueryDto,
    @Req() req: { user: { companyId: number } },
    @Query('status', new ParseEnumPipe(EquipmentStatus, { optional: true }))
    status?: EquipmentStatus,
    @Query('type', new ParseEnumPipe(EquipmentType, { optional: true }))
    type?: EquipmentType,
  ): Promise<{ items: EquipmentResponseDto[]; total: number }> {
    return this.equipmentService.findAll(
      pagination,
      req.user.companyId,
      status,
      type,
    );
  }

  @Get(':id')
  @Roles(UserRole.Admin, UserRole.Worker, UserRole.Customer)
  @ApiOperation({ summary: 'Get equipment by id' })
  @ApiResponse({
    status: 200,
    description: 'Equipment retrieved',
    type: EquipmentResponseDto,
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: { user: { companyId: number } },
  ): Promise<EquipmentResponseDto> {
    return this.equipmentService.findOne(id, req.user.companyId);
  }

  @Patch(':id')
  @Roles(UserRole.Admin, UserRole.Worker)
  @ApiOperation({ summary: 'Update equipment' })
  @ApiResponse({
    status: 200,
    description: 'Equipment updated',
    type: EquipmentResponseDto,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEquipmentDto: UpdateEquipmentDto,
    @Req() req: { user: { companyId: number } },
  ): Promise<EquipmentResponseDto> {
    return this.equipmentService.update(
      id,
      updateEquipmentDto,
      req.user.companyId,
    );
  }

  @Patch(':id/status')
  @Roles(UserRole.Admin, UserRole.Worker)
  @ApiOperation({ summary: 'Update equipment status' })
  @ApiResponse({
    status: 200,
    description: 'Equipment status updated',
    type: EquipmentResponseDto,
  })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEquipmentStatusDto: UpdateEquipmentStatusDto,
    @Req() req: { user: { companyId: number } },
  ): Promise<EquipmentResponseDto> {
    return this.equipmentService.updateStatus(
      id,
      updateEquipmentStatusDto.status,
      req.user.companyId,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.Admin, UserRole.Worker)
  @ApiOperation({ summary: 'Delete equipment' })
  @ApiResponse({ status: 204, description: 'Equipment deleted' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: { user: { companyId: number } },
  ): Promise<void> {
    await this.equipmentService.remove(id, req.user.companyId);
  }
}
