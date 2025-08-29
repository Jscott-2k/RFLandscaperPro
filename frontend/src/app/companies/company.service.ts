import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Company, CreateCompany, UpdateCompany } from './company.model';
import { User } from '../users/user.model';
import { CompaniesApiService } from '../api/companies-api.service';

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
