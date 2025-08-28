import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Equipment, EquipmentStatus } from './entities/equipment.entity';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { EquipmentResponseDto } from './dto/equipment-response.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Injectable()
export class EquipmentService {
  constructor(
    @InjectRepository(Equipment)
    private readonly equipmentRepository: Repository<Equipment>,
  ) {}

  async create(
    createEquipmentDto: CreateEquipmentDto,
    companyId: number,
  ): Promise<EquipmentResponseDto> {
    const equipment = this.equipmentRepository.create({
      ...createEquipmentDto,
      companyId,
    });
    const savedEquipment = await this.equipmentRepository.save(equipment);
    return this.toEquipmentResponseDto(savedEquipment);
  }

  async findAll(
    pagination: PaginationQueryDto,
    companyId: number,
    status?: EquipmentStatus,
    type?: string,
    search?: string,
  ): Promise<{ items: EquipmentResponseDto[]; total: number }> {
    const { page = 1, limit = 10 } = pagination;
    const cappedLimit = Math.min(limit, 100);
    const queryBuilder = this.equipmentRepository
      .createQueryBuilder('equipment')
      .where('equipment.companyId = :companyId', { companyId });

    if (status) {
      queryBuilder.andWhere('equipment.status = :status', { status });
    }

    if (type) {
      queryBuilder.andWhere('equipment.type = :type', { type });
    }

    if (search) {
      queryBuilder.andWhere(
        '(equipment.name ILIKE :search OR equipment.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [equipments, total] = await queryBuilder
      .skip((page - 1) * cappedLimit)
      .take(cappedLimit)
      .getManyAndCount();

    return {
      items: equipments.map((eq) => this.toEquipmentResponseDto(eq)),
      total,
    };
  }

  async findOne(id: number, companyId: number): Promise<EquipmentResponseDto> {
    const equipment = await this.equipmentRepository.findOne({
      where: { id, companyId },
    });
    if (!equipment) {
      throw new NotFoundException(`Equipment with ID ${id} not found.`);
    }
    return this.toEquipmentResponseDto(equipment);
  }

  async update(
    id: number,
    updateEquipmentDto: UpdateEquipmentDto,
    companyId: number,
  ): Promise<EquipmentResponseDto> {
    const equipment = await this.equipmentRepository.findOne({
      where: { id, companyId },
    });
    if (!equipment) {
      throw new NotFoundException(`Equipment with ID ${id} not found.`);
    }

    // Validate status transitions
    if (
      updateEquipmentDto.status &&
      equipment.status !== updateEquipmentDto.status
    ) {
      this.validateStatusTransition(
        equipment.status,
        updateEquipmentDto.status,
      );
    }

    Object.assign(equipment, updateEquipmentDto);
    const updatedEquipment = await this.equipmentRepository.save(equipment);
    return this.toEquipmentResponseDto(updatedEquipment);
  }

  async remove(id: number, companyId: number): Promise<void> {
    const equipment = await this.equipmentRepository.findOne({
      where: { id, companyId },
    });
    if (!equipment) {
      throw new NotFoundException(`Equipment with ID ${id} not found.`);
    }

    // Check if equipment is currently in use
    if (equipment.status === EquipmentStatus.IN_USE) {
      throw new BadRequestException(
        'Cannot remove equipment that is currently in use',
      );
    }

    await this.equipmentRepository.remove(equipment);
  }

  async updateStatus(
    id: number,
    status: EquipmentStatus,
    companyId: number,
  ): Promise<EquipmentResponseDto> {
    await this.findOne(id, companyId);
    return this.update(id, { status }, companyId);
  }

  private validateStatusTransition(
    currentStatus: EquipmentStatus,
    newStatus: EquipmentStatus,
  ): void {
    const validTransitions: Record<EquipmentStatus, EquipmentStatus[]> = {
      [EquipmentStatus.AVAILABLE]: [
        EquipmentStatus.IN_USE,
        EquipmentStatus.MAINTENANCE,
        EquipmentStatus.OUT_OF_SERVICE,
      ],
      [EquipmentStatus.IN_USE]: [
        EquipmentStatus.AVAILABLE,
        EquipmentStatus.MAINTENANCE,
      ],
      [EquipmentStatus.MAINTENANCE]: [
        EquipmentStatus.AVAILABLE,
        EquipmentStatus.OUT_OF_SERVICE,
      ],
      [EquipmentStatus.OUT_OF_SERVICE]: [
        EquipmentStatus.AVAILABLE,
        EquipmentStatus.MAINTENANCE,
      ],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  private toEquipmentResponseDto(equipment: Equipment): EquipmentResponseDto {
    return {
      id: equipment.id,
      name: equipment.name,
      type: equipment.type,
      status: equipment.status,
      location: equipment.location,
      description: equipment.description,
      lastMaintenanceDate: equipment.lastMaintenanceDate,
      createdAt: equipment.createdAt,
      updatedAt: equipment.updatedAt,
    };
  }
}
