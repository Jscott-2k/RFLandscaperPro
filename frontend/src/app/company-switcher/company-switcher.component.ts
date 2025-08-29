import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-company-switcher',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <select [(ngModel)]="selected" (ngModelChange)="onChange($event)">
      <option *ngFor="let c of auth.getCompanies()" [ngValue]="c">{{ c }}</option>
    </select>
  `,
})
export class CompanySwitcherComponent {
  protected auth = inject(AuthService);
  selected = this.auth.getCompany();

  onChange(company: string): void {
    if (company) {
      this.auth.setCompany(company);
    }
  }
}
