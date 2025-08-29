import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CompanyService } from './company.service';
import { Company } from './company.model';
import { ErrorService } from '../error.service';

@Component({
  selector: 'app-company-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
  private fb = inject(FormBuilder);
  company?: Company;

  form = this.fb.nonNullable.group({
    name: ['', Validators.required.bind(Validators)],
    address: ['', Validators.required.bind(Validators)],
    phone: ['', [Validators.required.bind(Validators), Validators.pattern(/^\d{10}$/)]],
    email: ['', [Validators.required.bind(Validators), Validators.email.bind(Validators)]],
  });

  ngOnInit(): void {
    this.companyService.getProfile().subscribe({
      next: (c) => {
        this.company = c;
        this.form.patchValue({
          name: c.name,
          address: c.address ?? '',
          phone: c.phone ?? '',
          email: c.email ?? '',
        });
      },
      error: () => this.errorService.show('Failed to load company profile'),
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
        next: () => {
          if (typeof window !== 'undefined') {
            window.alert('Company updated successfully');
          }
        },
        error: () => this.errorService.show('Failed to save company'),
      });
  }
}
