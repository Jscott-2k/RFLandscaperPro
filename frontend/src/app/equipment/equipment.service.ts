import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Equipment {
  id: number;
  name: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class EquipmentService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/equipment`;

  getEquipmentList(search?: string): Observable<Equipment[]> {
    const options = search ? { params: { search } } : {};
    return this.http
      .get<{ items: Equipment[] }>(this.baseUrl, options)
      .pipe(map((res) => res.items));
  }

  getEquipment(id: number): Observable<Equipment> {
    return this.http.get<Equipment>(`${this.baseUrl}/${id}`);
  }

  createEquipment(equipment: Partial<Equipment>): Observable<Equipment> {
    return this.http.post<Equipment>(this.baseUrl, equipment);
  }

  updateEquipment(id: number, equipment: Partial<Equipment>): Observable<Equipment> {
    return this.http.patch<Equipment>(`${this.baseUrl}/${id}`, equipment);
  }

  deleteEquipment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  updateEquipmentStatus(id: number, status: string): Observable<Equipment> {
    return this.http.patch<Equipment>(`${this.baseUrl}/${id}/status`, { status });
  }
}
