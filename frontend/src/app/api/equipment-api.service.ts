import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, Paginated, PaginationQuery } from '../api.service';
import { environment } from '../../environments/environment';

export interface Equipment {
  id: number;
  name: string;
  status: string;
  type: string;
}

export type CreateEquipment = Partial<Omit<Equipment, 'id'>>;
export type UpdateEquipment = Partial<CreateEquipment>;

@Injectable({ providedIn: 'root' })
export class EquipmentApiService extends ApiService {
  getEquipment(
    query: PaginationQuery & { status?: string; type?: string; search?: string } = {},
  ): Observable<Paginated<Equipment>> {
    return this.request<Paginated<Equipment>>('GET', `${environment.apiUrl}/equipment`, {
      params: query,
    });
  }

  getEquipmentById(id: number): Observable<Equipment> {
    return this.request<Equipment>('GET', `${environment.apiUrl}/equipment/${id}`);
  }

  createEquipment(payload: CreateEquipment): Observable<Equipment> {
    return this.request<Equipment>('POST', `${environment.apiUrl}/equipment`, { body: payload });
  }

  updateEquipment(id: number, payload: UpdateEquipment): Observable<Equipment> {
    return this.request<Equipment>('PATCH', `${environment.apiUrl}/equipment/${id}`, {
      body: payload,
    });
  }

  updateEquipmentStatus(id: number, status: string): Observable<Equipment> {
    return this.request<Equipment>('PATCH', `${environment.apiUrl}/equipment/${id}/status`, {
      body: { status },
    });
  }

  deleteEquipment(id: number): Observable<void> {
    return this.request<void>('DELETE', `${environment.apiUrl}/equipment/${id}`);
  }

  getEquipmentCount(status: string): Observable<{ items: unknown[]; total: number }> {
    return this.request<{ items: unknown[]; total: number }>(
      'GET',
      `${environment.apiUrl}/equipment`,
      {
        params: { status, limit: 1 },
      },
    );
  }
}
