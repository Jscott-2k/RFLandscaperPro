import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, CompanyMember, CompanyInvitation } from '../api.service';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class TeamService {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  private getCompanyId(): number {
    const id = this.auth.getCompany();
    return id ? Number(id) : 0;
  }

  getMembers(): Observable<CompanyMember[]> {
    return this.api.getCompanyMembers(this.getCompanyId());
  }

  updateMember(
    userId: number,
    payload: Partial<Pick<CompanyMember, 'role' | 'status'>>,
  ): Observable<CompanyMember> {
    return this.api.updateCompanyMember(this.getCompanyId(), userId, payload);
  }

  removeMember(userId: number): Observable<void> {
    return this.api.removeCompanyMember(this.getCompanyId(), userId);
  }

  getInvitations(): Observable<CompanyInvitation[]> {
    return this.api.getCompanyInvitations(this.getCompanyId());
  }

  invite(data: { email: string; role: string }): Observable<CompanyInvitation> {
    return this.api.createCompanyInvitation(this.getCompanyId(), data);
  }

  resendInvite(id: number): Observable<CompanyInvitation> {
    return this.api.resendCompanyInvitation(this.getCompanyId(), id);
  }

  revokeInvite(id: number): Observable<void> {
    return this.api.revokeCompanyInvitation(this.getCompanyId(), id);
  }
}
