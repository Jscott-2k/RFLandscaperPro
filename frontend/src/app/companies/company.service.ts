import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Company } from './company.model';
import { User } from '../users/user.service';
import { ApiService } from '../api.service';

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private api = inject(ApiService);

  getProfile(): Observable<Company> {
    return this.api.getCompanyProfile();
  }

  getWorkers(): Observable<User[]> {
    return this.api.getCompanyWorkers();
  }

  createCompany(company: Partial<Company>): Observable<Company> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.api.createCompany(company as any);
  }

  updateCompany(id: number, company: Partial<Company>): Observable<Company> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.api.updateCompany(id, company as any);
  }
}
