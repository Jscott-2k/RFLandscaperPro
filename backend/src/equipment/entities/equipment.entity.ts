import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { Company } from '../../companies/entities/company.entity';

export enum EquipmentType {
  MOWER = 'mower',
  TRIMMER = 'trimmer',
  BLOWER = 'blower',
  TRACTOR = 'tractor',
  TRUCK = 'truck',
  TRAILER = 'trailer',
  OTHER = 'other',
}

export enum EquipmentStatus {
  AVAILABLE = 'available',
  IN_USE = 'in_use',
  MAINTENANCE = 'maintenance',
  OUT_OF_SERVICE = 'out_of_service',
}

@Entity()
@Index(['status', 'type']) // Add index for common queries
@Index(['location']) // Add index for location-based queries
export class Equipment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: EquipmentType })
  type: EquipmentType;

  @Column({
    type: 'enum',
    enum: EquipmentStatus,
    default: EquipmentStatus.AVAILABLE,
  })
  status: EquipmentStatus;

  @Column({ nullable: true })
  location?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'date', nullable: true })
  lastMaintenanceDate?: Date;

  @Column()
  companyId: number;

  @ManyToOne(() => Company, (company) => company.equipment, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  changeStatus(newStatus: EquipmentStatus): void {
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

    if (!validTransitions[this.status]?.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${this.status} to ${newStatus}`,
      );
    }

    this.status = newStatus;
  }
}
