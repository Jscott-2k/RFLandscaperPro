import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export type Contract = {
  active?: boolean;
  customer?: { id: number; name: string; email: string };
  customerId: number;
  endDate?: string;
  frequency: string;
  id?: number;
  jobTemplate?: {
    title: string;
    description?: string;
    estimatedHours?: number;
    notes?: string;
  };
  startDate: string;
  totalOccurrences?: number;
}

@Injectable({ providedIn: 'root' })
export class ContractsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/contracts`;

  list(): Observable<Contract[]> {
    return this.http.get<Contract[]>(this.baseUrl);
  }

  get(id: number): Observable<Contract> {
    return this.http.get<Contract>(`${this.baseUrl}/${id}`);
  }

  create(contract: Contract): Observable<Contract> {
    return this.http.post<Contract>(this.baseUrl, contract);
  }

  update(id: number, contract: Contract): Observable<Contract> {
    return this.http.patch<Contract>(`${this.baseUrl}/${id}`, contract);
  }

  cancel(id: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/cancel`, {});
  }
}
