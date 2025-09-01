import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type Repository } from 'typeorm';

import { type Paginated, type PaginationParams, paginate } from '../../common/pagination';
import { Equipment, type EquipmentStatus } from '../entities/equipment.entity';

export const EQUIPMENT_REPOSITORY = Symbol('EQUIPMENT_REPOSITORY');

export type IEquipmentRepository = {
  create(data: Partial<Equipment>): Equipment;
  findAll(
    pagination: PaginationParams,
    companyId: number,
    status?: EquipmentStatus,
    type?: string,
    search?: string,
  ): Promise<Paginated<Equipment>>;
  findById(id: number, companyId: number): Promise<Equipment | null>;
  remove(equipment: Equipment): Promise<void>;
  save(equipment: Equipment): Promise<Equipment>;
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
      where: { companyId, id },
    });
  }

  async remove(equipment: Equipment): Promise<void> {
    await this.repo.remove(equipment);
  }
}
