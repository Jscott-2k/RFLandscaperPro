import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EquipmentService } from './equipment.service';
import { EquipmentController } from './equipment.controller';
import { Equipment } from './entities/equipment.entity';
import {
  EQUIPMENT_REPOSITORY,
  EquipmentRepository,
} from './repositories/equipment.repository';

const equipmentRepositoryProvider = {
  provide: EQUIPMENT_REPOSITORY,
  useClass: EquipmentRepository,
};

@Module({
  imports: [TypeOrmModule.forFeature([Equipment])],
  controllers: [EquipmentController],
  providers: [EquipmentService, equipmentRepositoryProvider],
  exports: [EquipmentService, EQUIPMENT_REPOSITORY],
})
export class EquipmentModule {}
