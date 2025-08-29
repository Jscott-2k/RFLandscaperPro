import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CompanyMembership } from '../auth/auth.service';

export interface InvitationPreview {
  companyName: string;
  email: string;
  role: string;
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
    data?: { name: string; password: string },
  ): Observable<{ access_token: string; companies?: CompanyMembership[] }> {
    return this.http.post<{ access_token: string; companies?: CompanyMembership[] }>(
      `${environment.apiUrl}/invitations/${token}/accept`,
      data ?? {},
    );
  }
}
