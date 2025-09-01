import { Injectable, inject } from '@angular/core';
import { type Observable } from 'rxjs';

import { CompaniesApiService } from '../api/companies-api.service';
import { type User } from '../users/user.model';
import { type Company, type CreateCompany, type UpdateCompany } from './company.model';

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private api = inject(CompaniesApiService);

  getProfile(): Observable<Company> {
    return this.api.getCompanyProfile();
  }

  getWorkers(): Observable<User[]> {
    return this.api.getCompanyWorkers();
  }

  createCompany(company: CreateCompany): Observable<Company> {
    return this.api.createCompany(company);
  }

  updateCompany(id: number, company: UpdateCompany): Observable<Company> {
    return this.api.updateCompany(id, company);
  }
}
