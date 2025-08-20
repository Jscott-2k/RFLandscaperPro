import { Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Job } from './job.entity';
import { User } from '../../users/user.entity';
import { Equipment } from '../../equipment/entities/equipment.entity';

@Entity()
export class Assignment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Job, (job) => job.assignments, { onDelete: 'CASCADE', eager: true })
  job: Job;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @ManyToOne(() => Equipment, { eager: true })
  equipment: Equipment;
}
