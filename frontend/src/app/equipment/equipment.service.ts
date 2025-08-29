import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../api.service';

export interface Equipment {
  id: number;
  name: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class EquipmentService {
  private api = inject(ApiService);

  getEquipmentList(search?: string): Observable<Equipment[]> {
    return this.api.getEquipment({ search }).pipe(map((res) => res.items));
  }

  getEquipment(id: number): Observable<Equipment> {
    return this.api.getEquipmentById(id);
  }

  createEquipment(equipment: Partial<Equipment>): Observable<Equipment> {
    return this.api.createEquipment(equipment);
  }

  updateEquipment(id: number, equipment: Partial<Equipment>): Observable<Equipment> {
    return this.api.updateEquipment(id, equipment);
  }

  deleteEquipment(id: number): Observable<void> {
    return this.api.deleteEquipment(id);
  }

  updateEquipmentStatus(id: number, status: string): Observable<Equipment> {
    return this.api.updateEquipmentStatus(id, status);
  }
}
