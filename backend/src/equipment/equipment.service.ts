import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EquipmentStatus } from './entities/equipment.entity';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { EquipmentResponseDto } from './dto/equipment-response.dto';
import { Paginated, PaginationParams } from '../common/pagination';
import {
  EQUIPMENT_REPOSITORY,
  IEquipmentRepository,
} from './repositories/equipment.repository';
import { Inject } from '@nestjs/common';
import { toEquipmentResponseDto } from './equipment.mapper';

@Injectable()
export class EquipmentService {
  constructor(
    @Inject(EQUIPMENT_REPOSITORY)
    private readonly equipmentRepository: IEquipmentRepository,
  ) {}

  async create(
    createEquipmentDto: CreateEquipmentDto,
    companyId: number,
  ): Promise<EquipmentResponseDto> {
    const equipment = this.equipmentRepository.create({
      ...createEquipmentDto,
      lastMaintenanceDate: createEquipmentDto.lastMaintenanceDate
        ? new Date(createEquipmentDto.lastMaintenanceDate)
        : undefined,
      companyId,
    });
    const savedEquipment = await this.equipmentRepository.save(equipment);
    return toEquipmentResponseDto(savedEquipment);
  }

  async findAll(
    pagination: PaginationParams,
    companyId: number,
    status?: EquipmentStatus,
    type?: string,
    search?: string,
  ): Promise<Paginated<EquipmentResponseDto>> {
    const { items, nextCursor } = await this.equipmentRepository.findAll(
      pagination,
      companyId,
      status,
      type,
      search,
    );

    return {
      items: items.map((eq) => toEquipmentResponseDto(eq)),
      nextCursor,
    };
  }

  async findOne(id: number, companyId: number): Promise<EquipmentResponseDto> {
    const equipment = await this.equipmentRepository.findById(id, companyId);
    if (!equipment) {
      throw new NotFoundException(`Equipment with ID ${id} not found.`);
    }
    return toEquipmentResponseDto(equipment);
  }

  async update(
    id: number,
    updateEquipmentDto: UpdateEquipmentDto,
    companyId: number,
  ): Promise<EquipmentResponseDto> {
    const equipment = await this.equipmentRepository.findById(id, companyId);
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
    return toEquipmentResponseDto(updatedEquipment);
  }

  async remove(id: number, companyId: number): Promise<void> {
    const equipment = await this.equipmentRepository.findById(id, companyId);
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
}
