import { Equipment } from './entities/equipment.entity';
import { EquipmentResponseDto } from './dto/equipment-response.dto';

export function toEquipmentResponseDto(
  equipment: Equipment,
): EquipmentResponseDto {
  return {
    id: equipment.id,
    name: equipment.name,
    type: equipment.type,
    status: equipment.status,
    location: equipment.location,
    description: equipment.description,
    lastMaintenanceDate: equipment.lastMaintenanceDate,
    createdAt: equipment.createdAt,
    updatedAt: equipment.updatedAt,
  };
}
