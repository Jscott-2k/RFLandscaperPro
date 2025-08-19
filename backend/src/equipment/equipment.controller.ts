import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { EquipmentResponseDto } from './dto/equipment-response.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Post()
  @Roles(UserRole.Admin, UserRole.Worker)
  async create(
    @Body() createEquipmentDto: CreateEquipmentDto,
  ): Promise<EquipmentResponseDto> {
    return this.equipmentService.create(createEquipmentDto);
  }

  @Get()
  @Roles(UserRole.Admin, UserRole.Worker, UserRole.Customer)
  async findAll(): Promise<EquipmentResponseDto[]> {
    return this.equipmentService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.Admin, UserRole.Worker, UserRole.Customer)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<EquipmentResponseDto> {
    return this.equipmentService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.Admin, UserRole.Worker)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEquipmentDto: UpdateEquipmentDto,
  ): Promise<EquipmentResponseDto> {
    return this.equipmentService.update(id, updateEquipmentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.Admin, UserRole.Worker)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.equipmentService.remove(id);
  }
}
