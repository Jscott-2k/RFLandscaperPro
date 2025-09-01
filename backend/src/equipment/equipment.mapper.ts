import { type EquipmentResponseDto } from './dto/equipment-response.dto';
import { type Equipment } from './entities/equipment.entity';

export function toEquipmentResponseDto(
  equipment: Equipment,
): EquipmentResponseDto {
  return {
    createdAt: equipment.createdAt,
    description: equipment.description,
    id: equipment.id,
    lastMaintenanceDate: equipment.lastMaintenanceDate,
    location: equipment.location,
    name: equipment.name,
    status: equipment.status,
    type: equipment.type,
    updatedAt: equipment.updatedAt,
  };
}
