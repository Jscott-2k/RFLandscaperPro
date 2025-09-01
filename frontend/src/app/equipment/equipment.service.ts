import { Injectable, inject } from '@angular/core';
import { type Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  EquipmentApiService,
  type Equipment,
  type CreateEquipment,
  type UpdateEquipment,
} from '../api/equipment-api.service';

export type { Equipment, CreateEquipment, UpdateEquipment } from '../api/equipment-api.service';

@Injectable({ providedIn: 'root' })
export class EquipmentService {
  private api = inject(EquipmentApiService);

  getEquipmentList(search?: string): Observable<Equipment[]> {
    return this.api.getEquipment({ search }).pipe(map((res) => res.items));
  }

  getEquipment(id: number): Observable<Equipment> {
    return this.api.getEquipmentById(id);
  }

  createEquipment(equipment: CreateEquipment): Observable<Equipment> {
    return this.api.createEquipment(equipment);
  }

  updateEquipment(id: number, equipment: UpdateEquipment): Observable<Equipment> {
    return this.api.updateEquipment(id, equipment);
  }

  deleteEquipment(id: number): Observable<void> {
    return this.api.deleteEquipment(id);
  }

  updateEquipmentStatus(id: number, status: string): Observable<Equipment> {
    return this.api.updateEquipmentStatus(id, status);
  }
}
