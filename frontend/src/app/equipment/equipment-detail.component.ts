import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { ErrorService } from '../error.service';
import { ToasterService } from '../toaster.service';
import { EquipmentService, type CreateEquipment } from './equipment.service';

@Component({
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  selector: 'app-equipment-detail',
  standalone: true,
  template: `
    <div>
      <h2>Equipment Detail</h2>
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
          Status:
          <input formControlName="status" />
        </label>
        <div
          *ngIf="
            form.controls.status.errors &&
            (form.controls.status.dirty || form.controls.status.touched)
          "
        >
          {{ form.controls.status.errors | json }}
        </div>
        <button type="submit">Save</button>
        <button type="button" (click)="remove()" *ngIf="equipmentId">Delete</button>
      </form>
    </div>
  `,
})
export class EquipmentDetailComponent {
  private equipmentService = inject(EquipmentService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private errorService = inject(ErrorService);
  private notifications = inject(ToasterService);
  private fb = inject(FormBuilder);

  equipmentId?: number;

  form = this.fb.nonNullable.group({
    name: ['', Validators.required.bind(Validators)],
    status: ['', Validators.required.bind(Validators)],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.equipmentService.getEquipment(+id).subscribe({
        error: () => this.errorService.show('Failed to load equipment'),
        next: (data) => {
          this.equipmentId = data.id;
          this.form.patchValue(data);
        },
      });
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload = this.form.getRawValue() as CreateEquipment;
    if (this.equipmentId) {
      this.equipmentService.updateEquipment(this.equipmentId, payload).subscribe({
        error: () => this.errorService.show('Failed to update equipment'),
        next: () => {
          this.notifications.show('Equipment updated successfully');
          void this.router.navigate(['/equipment']);
        },
      });
    } else {
      this.equipmentService.createEquipment(payload).subscribe({
        error: () => this.errorService.show('Failed to create equipment'),
        next: () => {
          this.notifications.show('Equipment created successfully');
          void this.router.navigate(['/equipment']);
        },
      });
    }
  }

  remove(): void {
    if (this.equipmentId) {
      this.equipmentService.deleteEquipment(this.equipmentId).subscribe({
        error: () => this.errorService.show('Failed to delete equipment'),
        next: () => {
          this.notifications.show('Equipment deleted successfully');
          void this.router.navigate(['/equipment']);
        },
      });
    }
  }
}
