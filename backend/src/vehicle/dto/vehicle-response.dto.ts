export class VehicleResponseDto {
  id: number;
  identifier: string;
  capacity: number;
  status: string;
  currentLocation?: string;
  equipment: { id: number; name: string }[];
  createdAt: Date;
  updatedAt: Date;
}
