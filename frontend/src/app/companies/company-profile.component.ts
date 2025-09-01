import { CommonModule } from '@angular/common';
import { Component, type OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ErrorService } from '../error.service';
import { ToasterService } from '../toaster.service';
import { type Company } from './company.model';
import { CompanyService } from './company.service';

@Component({
  imports: [CommonModule, ReactiveFormsModule],
  selector: 'app-company-profile',
  standalone: true,
  template: `
    <div *ngIf="company">
      <h2>Company Profile</h2>
      <form [formGroup]="form" (ngSubmit)="save()">
        <label>
          Name:
          <input formControlName="name" />
        </label>
        <div
          *ngIf="
            form.controls.name.errors && (form.controls.name.dirty || form.controls.name.touched)
          "
        >
          {{ form.controls.name.errors | json }}
        </div>
        <label>
          Address:
          <input formControlName="address" />
        </label>
        <div
          *ngIf="
            form.controls.address.errors &&
            (form.controls.address.dirty || form.controls.address.touched)
          "
        >
          {{ form.controls.address.errors | json }}
        </div>
        <label>
          Phone:
          <input formControlName="phone" />
        </label>
        <div
          *ngIf="
            form.controls.phone.errors && (form.controls.phone.dirty || form.controls.phone.touched)
          "
        >
          {{ form.controls.phone.errors | json }}
        </div>
        <label>
          Email:
          <input formControlName="email" />
        </label>
        <div
          *ngIf="
            form.controls.email.errors && (form.controls.email.dirty || form.controls.email.touched)
          "
        >
          {{ form.controls.email.errors | json }}
        </div>
        <button type="submit">Save</button>
      </form>
    </div>
  `,
})
export class CompanyProfileComponent implements OnInit {
  private readonly companyService = inject(CompanyService);
  private readonly errorService = inject(ErrorService);
  private readonly notifications = inject(ToasterService);
  private fb = inject(FormBuilder);
  company?: Company;

  form = this.fb.nonNullable.group({
    address: ['', Validators.required.bind(Validators)],
    email: ['', [Validators.required.bind(Validators), Validators.email.bind(Validators)]],
    name: ['', Validators.required.bind(Validators)],
    phone: ['', [Validators.required.bind(Validators), Validators.pattern(/^\d{10}$/)]],
  });

  ngOnInit(): void {
    this.companyService.getProfile().subscribe({
      error: () => this.errorService.show('Failed to load company profile'),
      next: (c) => {
        this.company = c;
        this.form.patchValue({
          address: c.address ?? '',
          email: c.email ?? '',
          name: c.name,
          phone: c.phone ?? '',
        });
      },
    });
  }

  save(): void {
    if (!this.company || !this.company.id) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.companyService
      .updateCompany(this.company.id, { ...this.company, ...this.form.getRawValue() })
      .subscribe({
        error: () => this.errorService.show('Failed to save company'),
        next: () => {
          this.notifications.show('Company updated successfully');
        },
      });
  }
}
