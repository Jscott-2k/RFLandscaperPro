import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Equipment, EquipmentStatus } from '../entities/equipment.entity';
import { Paginated, PaginationParams, paginate } from '../../common/pagination';

export const EQUIPMENT_REPOSITORY = Symbol('EQUIPMENT_REPOSITORY');

export interface IEquipmentRepository {
  create(data: Partial<Equipment>): Equipment;
  save(equipment: Equipment): Promise<Equipment>;
  findAll(
    pagination: PaginationParams,
    companyId: number,
    status?: EquipmentStatus,
    type?: string,
    search?: string,
  ): Promise<Paginated<Equipment>>;
  findById(id: number, companyId: number): Promise<Equipment | null>;
  remove(equipment: Equipment): Promise<void>;
}

@Injectable()
export class EquipmentRepository implements IEquipmentRepository {
  constructor(
    @InjectRepository(Equipment)
    private readonly repo: Repository<Equipment>,
  ) {}

  create(data: Partial<Equipment>): Equipment {
    return this.repo.create(data);
  }

  save(equipment: Equipment): Promise<Equipment> {
    return this.repo.save(equipment);
  }

  async findAll(
    pagination: PaginationParams,
    companyId: number,
    status?: EquipmentStatus,
    type?: string,
    search?: string,
  ): Promise<Paginated<Equipment>> {
    return paginate(this.repo, pagination, 'equipment', (qb) => {
      qb.where('equipment.companyId = :companyId', { companyId });

      if (status) {
        qb.andWhere('equipment.status = :status', { status });
      }

      if (type) {
        qb.andWhere('equipment.type = :type', { type });
      }

      if (search) {
        qb.andWhere(
          '(equipment.name ILIKE :search OR equipment.type ILIKE :search OR equipment.description ILIKE :search)',
          { search: `%${search}%` },
        );
      }

      return qb;
    });
  }

  findById(id: number, companyId: number): Promise<Equipment | null> {
    return this.repo.findOne({
      where: { id, companyId },
    });
  }

  async remove(equipment: Equipment): Promise<void> {
    await this.repo.remove(equipment);
  }
}
