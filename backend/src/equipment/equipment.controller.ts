import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { EquipmentResponseDto } from './dto/equipment-response.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
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
  ): Promise<EquipmentResponseDto> {
    return this.equipmentService.create(createEquipmentDto);
  }

  @Get()
  @Roles(UserRole.Admin, UserRole.Worker, UserRole.Customer)
  @ApiOperation({ summary: 'List equipment' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'List of equipment' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ): Promise<{ items: EquipmentResponseDto[]; total: number }> {
    return this.equipmentService.findAll(page, limit);
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
  ): Promise<EquipmentResponseDto> {
    return this.equipmentService.findOne(id);
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
  ): Promise<EquipmentResponseDto> {
    return this.equipmentService.update(id, updateEquipmentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.Admin, UserRole.Worker)
  @ApiOperation({ summary: 'Delete equipment' })
  @ApiResponse({ status: 204, description: 'Equipment deleted' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.equipmentService.remove(id);
  }
}
