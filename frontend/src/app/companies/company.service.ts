import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { Company } from './company.model';
import { User } from '../users/user.service';

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/companies`;

  getProfile(): Observable<Company> {
    return this.http.get<Company>(`${this.baseUrl}/profile`);
  }

  getWorkers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/workers`);
  }

  createCompany(company: Partial<Company>): Observable<Company> {
    return this.http.post<Company>(this.baseUrl, company);
  }

  updateCompany(id: number, company: Partial<Company>): Observable<Company> {
    return this.http.patch<Company>(`${this.baseUrl}/${id}`, company);
  }
}
