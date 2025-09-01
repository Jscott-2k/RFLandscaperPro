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

  @Column({ enum: EquipmentType, type: 'enum' })
  type: EquipmentType;

  @Column({
    default: EquipmentStatus.AVAILABLE,
    enum: EquipmentStatus,
    type: 'enum',
  })
  status: EquipmentStatus;

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Column({ nullable: true, type: 'date' })
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
}
