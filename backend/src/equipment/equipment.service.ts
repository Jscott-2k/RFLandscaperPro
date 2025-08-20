import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Equipment } from './entities/equipment.entity';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { EquipmentResponseDto } from './dto/equipment-response.dto';

@Injectable()
export class EquipmentService {
  constructor(
    @InjectRepository(Equipment)
    private readonly equipmentRepository: Repository<Equipment>,
  ) {}

  async create(
    createEquipmentDto: CreateEquipmentDto,
  ): Promise<EquipmentResponseDto> {
    const equipment = this.equipmentRepository.create(createEquipmentDto);
    const savedEquipment = await this.equipmentRepository.save(equipment);
    return this.toEquipmentResponseDto(savedEquipment);
  }

  async findAll(
    page = 1,
    limit = 10,
  ): Promise<{ items: EquipmentResponseDto[]; total: number }> {
    const [equipmentList, total] = await this.equipmentRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      items: equipmentList.map((eq) => this.toEquipmentResponseDto(eq)),
      total,
    };
  }

  async findOne(id: number): Promise<EquipmentResponseDto> {
    const equipment = await this.equipmentRepository.findOne({ where: { id } });
    if (!equipment) {
      throw new NotFoundException(`Equipment with ID ${id} not found.`);
    }
    return this.toEquipmentResponseDto(equipment);
  }

  async update(
    id: number,
    updateEquipmentDto: UpdateEquipmentDto,
  ): Promise<EquipmentResponseDto> {
    const equipment = await this.equipmentRepository.findOne({ where: { id } });
    if (!equipment) {
      throw new NotFoundException(`Equipment with ID ${id} not found.`);
    }
    Object.assign(equipment, updateEquipmentDto);
    const updatedEquipment = await this.equipmentRepository.save(equipment);
    return this.toEquipmentResponseDto(updatedEquipment);
  }

  async remove(id: number): Promise<void> {
    const equipment = await this.equipmentRepository.findOne({ where: { id } });
    if (!equipment) {
      throw new NotFoundException(`Equipment with ID ${id} not found.`);
    }
    await this.equipmentRepository.remove(equipment);
  }

  private toEquipmentResponseDto(equipment: Equipment): EquipmentResponseDto {
    return {
      id: equipment.id,
      name: equipment.name,
      type: equipment.type,
      status: equipment.status,
      location: equipment.location,
      assignedTruckId: equipment.assignedTruckId,
      createdAt: equipment.createdAt,
      updatedAt: equipment.updatedAt,
    };
  }
}
