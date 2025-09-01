import { CommonModule } from '@angular/common';
import { Component, type OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { type CompanyMember, type CompanyInvitation } from '../api/companies-api.service';
import { TeamService } from './team.service';

@Component({
  imports: [CommonModule, FormsModule],
  selector: 'app-team',
  standalone: true,
  template: `
    <h2>Members</h2>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let m of members">
          <td>{{ m.username }}</td>
          <td>{{ m.email }}</td>
          <td>
            <select [(ngModel)]="m.role" (change)="updateMember(m)">
              <option value="OWNER">Owner</option>
              <option value="ADMIN">Admin</option>
              <option value="WORKER">Worker</option>
            </select>
          </td>
          <td>
            <select [(ngModel)]="m.status" (change)="updateMember(m)">
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </td>
          <td>
            <button (click)="removeMember(m)">Remove</button>
          </td>
        </tr>
      </tbody>
    </table>

    <h3>Invite Member</h3>
    <form (ngSubmit)="sendInvite()" #inviteForm="ngForm">
      <input type="email" name="email" [(ngModel)]="invite.email" required placeholder="Email" />
      <select name="role" [(ngModel)]="invite.role">
        <option value="WORKER">Worker</option>
        <option value="ADMIN">Admin</option>
      </select>
      <button type="submit" [disabled]="inviteForm.invalid">Invite</button>
    </form>

    <h2>Pending Invitations</h2>
    <table>
      <thead>
        <tr>
          <th>Email</th>
          <th>Role</th>
          <th>Expires</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let i of invitations">
          <td>{{ i.email }}</td>
          <td>{{ i.role }}</td>
          <td>{{ i.expiresAt | date: 'short' }}</td>
          <td>
            <button (click)="resend(i)">Resend</button>
            <button (click)="revoke(i)">Revoke</button>
          </td>
        </tr>
      </tbody>
    </table>
  `,
})
export class TeamComponent implements OnInit {
  private service = inject(TeamService);

  members: CompanyMember[] = [];
  invitations: CompanyInvitation[] = [];
  invite = { email: '', role: 'WORKER' };

  ngOnInit(): void {
    this.loadMembers();
    this.loadInvitations();
  }

  private loadMembers(): void {
    this.service.getMembers().subscribe((m) => (this.members = m));
  }

  private loadInvitations(): void {
    this.service.getInvitations().subscribe((i) => (this.invitations = i));
  }

  updateMember(m: CompanyMember): void {
    this.service
      .updateMember(m.userId, { role: m.role, status: m.status })
      .subscribe((updated) => Object.assign(m, updated));
  }

  removeMember(m: CompanyMember): void {
    if (!confirm('Remove this member?')) {return;}
    this.service.removeMember(m.userId).subscribe(() => {
      this.members = this.members.filter((x) => x.userId !== m.userId);
    });
  }

  sendInvite(): void {
    this.service.invite(this.invite).subscribe((inv) => {
      this.invitations.push(inv);
      this.invite = { email: '', role: 'WORKER' };
    });
  }

  resend(inv: CompanyInvitation): void {
    this.service.resendInvite(inv.id).subscribe((updated) => {
      const idx = this.invitations.findIndex((x) => x.id === updated.id);
      if (idx > -1) {this.invitations[idx] = updated;}
    });
  }

  revoke(inv: CompanyInvitation): void {
    if (!confirm('Revoke this invitation?')) {return;}
    this.service.revokeInvite(inv.id).subscribe(() => {
      this.invitations = this.invitations.filter((x) => x.id !== inv.id);
    });
  }
}
