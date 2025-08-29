import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Equipment, EquipmentStatus } from '../entities/equipment.entity';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export const EQUIPMENT_REPOSITORY = Symbol('EQUIPMENT_REPOSITORY');

export interface IEquipmentRepository {
  create(data: Partial<Equipment>): Equipment;
  save(equipment: Equipment): Promise<Equipment>;
  findAll(
    pagination: PaginationQueryDto,
    companyId: number,
    status?: EquipmentStatus,
    type?: string,
    search?: string,
  ): Promise<[Equipment[], number]>;
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
    pagination: PaginationQueryDto,
    companyId: number,
    status?: EquipmentStatus,
    type?: string,
    search?: string,
  ): Promise<[Equipment[], number]> {
    const { page = 1, limit = 10 } = pagination;
    const cappedLimit = Math.min(limit, 100);
    const queryBuilder = this.repo
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
        '(equipment.name ILIKE :search OR equipment.type ILIKE :search OR equipment.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    return queryBuilder
      .skip((page - 1) * cappedLimit)
      .take(cappedLimit)
      .getManyAndCount();
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
