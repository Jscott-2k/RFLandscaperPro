import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorService } from './error.service';
import { UpcomingJobSummary, EquipmentCount } from './models/dashboard.models';

export interface Paginated<T> {
  items: T[];
  total: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private errorService = inject(ErrorService);

  private handleError = (error: HttpErrorResponse) => {
    const message =
      error.error &&
      typeof error.error === 'object' &&
      'message' in error.error &&
      typeof (error.error as { message?: unknown }).message === 'string'
        ? (error.error as { message: string }).message
        : 'An unexpected error occurred. Please try again later.';
    this.errorService.show(message);
    return throwError(() => new Error(message));
  };

  private toHttpParams(params?: Record<string, unknown>): HttpParams {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          const stringValue =
            typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
              ? String(value)
              : JSON.stringify(value);
          httpParams = httpParams.set(key, stringValue);
        }
      });
    }
    return httpParams;
  }

  protected request<T>(
    method: string,
    url: string,
    options: { params?: Record<string, unknown>; body?: unknown } = {},
  ): Observable<T> {
    return this.http
      .request<T>(method, url, {
        body: options.body,
        params: this.toHttpParams(options.params),
      })
      .pipe(catchError(this.handleError));
  }

  getHealth(): Observable<{ status: string }> {
    return this.request<{ status: string }>('GET', `${environment.apiUrl}/health`);
  }

  // Customers
  getCustomers(
    query: PaginationQuery & { active?: boolean; search?: string } = {},
  ): Observable<Paginated<Customer>> {
    return this.request<Paginated<Customer>>('GET', `${environment.apiUrl}/customers`, {
      params: query,
    });
  }

  getCustomer(id: number): Observable<Customer> {
    return this.request<Customer>('GET', `${environment.apiUrl}/customers/${id}`);
  }

  createCustomer(payload: CreateCustomer): Observable<Customer> {
    return this.request<Customer>('POST', `${environment.apiUrl}/customers`, { body: payload });
  }

  updateCustomer(id: number, payload: UpdateCustomer): Observable<Customer> {
    return this.request<Customer>('PATCH', `${environment.apiUrl}/customers/${id}`, {
      body: payload,
    });
  }

  deleteCustomer(id: number): Observable<void> {
    return this.request<void>('DELETE', `${environment.apiUrl}/customers/${id}`);
  }

  // Equipment
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

  // Jobs
  getJobs(
    query: PaginationQuery & {
      completed?: boolean;
      customerId?: number;
      startDate?: string;
      endDate?: string;
      workerId?: number;
      equipmentId?: number;
    } = {},
  ): Observable<Paginated<Job>> {
    return this.request<Paginated<Job>>('GET', `${environment.apiUrl}/jobs`, {
      params: query,
    });
  }

  getJob(id: number): Observable<Job> {
    return this.request<Job>('GET', `${environment.apiUrl}/jobs/${id}`);
  }

  createJob(payload: CreateJob): Observable<Job> {
    return this.request<Job>('POST', `${environment.apiUrl}/jobs`, { body: payload });
  }

  updateJob(id: number, payload: UpdateJob): Observable<Job> {
    return this.request<Job>('PATCH', `${environment.apiUrl}/jobs/${id}`, { body: payload });
  }

  assignJob(id: number, payload: { userId: number; equipmentId: number }): Observable<Job> {
    return this.request<Job>('POST', `${environment.apiUrl}/jobs/${id}/assign`, {
      body: payload,
    });
  }

  scheduleJob(id: number, date: string): Observable<Job> {
    return this.request<Job>('POST', `${environment.apiUrl}/jobs/${id}/schedule`, {
      body: { scheduledDate: date },
    });
  }

  deleteJob(id: number): Observable<void> {
    return this.request<void>('DELETE', `${environment.apiUrl}/jobs/${id}`);
  }

  // Users
  getUsers(): Observable<User[]> {
    return this.request<User[]>('GET', `${environment.apiUrl}/users`);
  }

  getUser(id: number): Observable<User> {
    return this.request<User>('GET', `${environment.apiUrl}/users/${id}`);
  }

  createUser(payload: CreateUser): Observable<User> {
    return this.request<User>('POST', `${environment.apiUrl}/users`, { body: payload });
  }

  updateUser(id: number, payload: UpdateUser): Observable<User> {
    return this.request<User>('PATCH', `${environment.apiUrl}/users/${id}`, { body: payload });
  }

  deleteUser(id: number): Observable<void> {
    return this.request<void>('DELETE', `${environment.apiUrl}/users/${id}`);
  }

  getMe(): Observable<User> {
    return this.request<User>('GET', `${environment.apiUrl}/users/me`);
  }

  updateMe(payload: UpdateUser): Observable<User> {
    return this.request<User>('PUT', `${environment.apiUrl}/users/me`, { body: payload });
  }

  // Companies
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

  // Company Members
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

  // Company Invitations
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

  getUpcomingJobs(): Observable<{ items: UpcomingJobSummary[]; total: number }> {
    return this.request<{ items: UpcomingJobSummary[]; total: number }>(
      'GET',
      `${environment.apiUrl}/jobs`,
      {
        params: { completed: false, limit: 5 },
      },
    );
  }

  getEquipmentCount(status: string): Observable<{ items: EquipmentCount[]; total: number }> {
    return this.request<{ items: EquipmentCount[]; total: number }>(
      'GET',
      `${environment.apiUrl}/equipment`,
      {
        params: { status, limit: 1 },
      },
    );
  }

}
