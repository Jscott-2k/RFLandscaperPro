import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompanyService } from './company.service';
import { Company } from './company.model';

@Component({
  selector: 'app-company-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="company">
      <h2>Company Profile</h2>
      <form (ngSubmit)="save()">
        <label>Name:
          <input name="name" [(ngModel)]="company.name" />
        </label>
        <label>Address:
          <input name="address" [(ngModel)]="company.address" />
        </label>
        <label>Phone:
          <input name="phone" [(ngModel)]="company.phone" />
        </label>
        <label>Email:
          <input name="email" [(ngModel)]="company.email" />
        </label>
        <button type="submit">Save</button>
      </form>
    </div>
  `
})
export class CompanyProfileComponent implements OnInit {
  private readonly companyService = inject(CompanyService);
  company?: Company;

  ngOnInit(): void {
    this.companyService.getProfile().subscribe(c => (this.company = c));
  }

  save(): void {
    if (!this.company || !this.company.id) {
      return;
    }
    this.companyService.updateCompany(this.company.id, this.company).subscribe();
  }
}

