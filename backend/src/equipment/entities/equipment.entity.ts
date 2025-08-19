import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Vehicle } from '../../vehicle/entities/vehicle.entity';

@Entity()
export class Equipment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToMany(() => Vehicle, (vehicle) => vehicle.equipment)
  vehicles: Vehicle[];
}
