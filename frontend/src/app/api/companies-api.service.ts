import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api.service';
import { environment } from '../../environments/environment';
import { User } from './users-api.service';

export interface Company {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  ownerId?: number;
}

export type CreateCompany = Partial<Omit<Company, 'id'>>;
export type UpdateCompany = Partial<CreateCompany>;

export interface CompanyMember {
  userId: number;
  username: string;
  email: string;
  role: string;
  status: string;
}

export interface CompanyInvitation {
  id: number;
  email: string;
  role: string;
  expiresAt: string;
}

@Injectable({ providedIn: 'root' })
export class CompaniesApiService extends ApiService {
  getCompanyProfile(): Observable<Company> {
    return this.request<Company>('GET', `${environment.apiUrl}/companies/profile`);
  }

  getCompanyWorkers(): Observable<User[]> {
    return this.request<User[]>('GET', `${environment.apiUrl}/companies/workers`);
  }

  createCompany(payload: CreateCompany): Observable<Company> {
    return this.request<Company>('POST', `${environment.apiUrl}/companies`, { body: payload });
  }

  updateCompany(id: number, payload: UpdateCompany): Observable<Company> {
    return this.request<Company>('PATCH', `${environment.apiUrl}/companies/${id}`, {
      body: payload,
    });
  }

  getCompanyMembers(companyId: number): Observable<CompanyMember[]> {
    return this.request<CompanyMember[]>(
      'GET',
      `${environment.apiUrl}/companies/${companyId}/members`,
    );
  }

  updateCompanyMember(
    companyId: number,
    userId: number,
    payload: Partial<Pick<CompanyMember, 'role' | 'status'>>,
  ): Observable<CompanyMember> {
    return this.request<CompanyMember>(
      'PATCH',
      `${environment.apiUrl}/companies/${companyId}/members/${userId}`,
      {
        body: payload,
      },
    );
  }

  removeCompanyMember(companyId: number, userId: number): Observable<void> {
    return this.request<void>(
      'DELETE',
      `${environment.apiUrl}/companies/${companyId}/members/${userId}`,
    );
  }

  getCompanyInvitations(companyId: number): Observable<CompanyInvitation[]> {
    return this.request<CompanyInvitation[]>(
      'GET',
      `${environment.apiUrl}/companies/${companyId}/invitations`,
    );
  }

  createCompanyInvitation(
    companyId: number,
    payload: { email: string; role: string },
  ): Observable<CompanyInvitation> {
    return this.request<CompanyInvitation>(
      'POST',
      `${environment.apiUrl}/companies/${companyId}/invitations`,
      {
        body: payload,
      },
    );
  }

  revokeCompanyInvitation(companyId: number, inviteId: number): Observable<void> {
    return this.request<void>(
      'POST',
      `${environment.apiUrl}/companies/${companyId}/invitations/${inviteId}/revoke`,
    );
  }

  resendCompanyInvitation(companyId: number, inviteId: number): Observable<CompanyInvitation> {
    return this.request<CompanyInvitation>(
      'POST',
      `${environment.apiUrl}/companies/${companyId}/invitations/${inviteId}/resend`,
    );
  }
}
