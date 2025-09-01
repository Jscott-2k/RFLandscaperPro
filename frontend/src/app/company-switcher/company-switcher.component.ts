import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../auth/auth.service';

@Component({
  imports: [CommonModule, FormsModule],
  selector: 'app-company-switcher',
  standalone: true,
  template: `
    <select [(ngModel)]="selected" (ngModelChange)="onChange($event)">
      <option *ngFor="let c of auth.getCompanies()" [ngValue]="c.companyId">
        {{ c.companyName || c.companyId }}
      </option>
    </select>
  `,
})
export class CompanySwitcherComponent {
  protected auth = inject(AuthService);
  selected = this.auth.getCompany();

  onChange(companyId: number): void {
    if (companyId) {
      this.auth.switchCompany(companyId).subscribe(() => {
        this.selected = companyId;
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      });
    }
  }
}
