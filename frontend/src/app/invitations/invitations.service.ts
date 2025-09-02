import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type CompanyMembership, type CompanyUserRole } from '@rflp/shared';
import { type Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export type InvitationPreview = {
  companyName: string;
  email: string;
  role: CompanyUserRole;
  status: 'valid' | 'expired' | 'revoked' | 'accepted';
}

@Injectable({ providedIn: 'root' })
export class InvitationsService {
  private http = inject(HttpClient);

  preview(token: string): Observable<InvitationPreview> {
    return this.http.get<InvitationPreview>(`${environment.apiUrl}/invitations/${token}`);
  }

  accept(
    token: string,
    data?: {
      name: string;
      password: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
    },
  ): Observable<{ access_token: string; refresh_token?: string; companies?: CompanyMembership[] }> {
    return this.http.post<{
      access_token: string;
      refresh_token?: string;
      companies?: CompanyMembership[];
    }>(`${environment.apiUrl}/invitations/${token}/accept`, data ?? {});
  }
}
