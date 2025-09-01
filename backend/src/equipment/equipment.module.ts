import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Equipment } from './entities/equipment.entity';
import { EquipmentController } from './equipment.controller';
import { EquipmentService } from './equipment.service';
import {
  EQUIPMENT_REPOSITORY,
  EquipmentRepository,
} from './repositories/equipment.repository';

const equipmentRepositoryProvider = {
  provide: EQUIPMENT_REPOSITORY,
  useClass: EquipmentRepository,
};

@Module({
  controllers: [EquipmentController],
  exports: [EquipmentService, EQUIPMENT_REPOSITORY],
  imports: [TypeOrmModule.forFeature([Equipment])],
  providers: [EquipmentService, equipmentRepositoryProvider],
})
export class EquipmentModule {}
