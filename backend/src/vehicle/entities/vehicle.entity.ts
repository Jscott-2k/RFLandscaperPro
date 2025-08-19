import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Equipment } from '../../equipment/entities/equipment.entity';

@Entity()
export class Vehicle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  identifier: string;

  @Column('int')
  capacity: number;

  @Column({ default: 'available' })
  status: string;

  @Column({ nullable: true })
  currentLocation?: string;

  @ManyToMany(() => Equipment, (equipment) => equipment.vehicles, {
    eager: true,
  })
  @JoinTable()
  equipment: Equipment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
