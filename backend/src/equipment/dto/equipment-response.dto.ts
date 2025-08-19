export class EquipmentResponseDto {
  id: number;
  name: string;
  type: string;
  status: string;
  location?: string;
  assignedTruckId?: number;
  createdAt: Date;
  updatedAt: Date;
}
