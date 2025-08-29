import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EquipmentService, Equipment } from './equipment.service';
import { ErrorService } from '../error.service';

@Component({
  selector: 'app-equipment-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div>
      <h2>Equipment Detail</h2>
      <form (ngSubmit)="save()">
        <label>
          Name:
          <input [(ngModel)]="equipment.name" name="name" />
        </label>
        <label>
          Status:
          <input [(ngModel)]="equipment.status" name="status" />
        </label>
        <button type="submit">Save</button>
        <button type="button" (click)="remove()" *ngIf="equipment.id">Delete</button>
      </form>
    </div>
  `,
})
export class EquipmentDetailComponent {
  equipment: Partial<Equipment> = { name: '', status: '' };
  private equipmentService = inject(EquipmentService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private errorService = inject(ErrorService);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.equipmentService.getEquipment(+id).subscribe({
        next: (data) => (this.equipment = data),
        error: () => this.errorService.show('Failed to load equipment'),
      });
    }
  }

  save(): void {
    if (this.equipment.id) {
      this.equipmentService.updateEquipment(this.equipment.id, this.equipment).subscribe({
        next: () => {
          if (typeof window !== 'undefined') {
            window.alert('Equipment updated successfully');
          }
          void this.router.navigate(['/equipment']);
        },
        error: () => this.errorService.show('Failed to update equipment'),
      });
    } else {
      this.equipmentService.createEquipment(this.equipment).subscribe({
        next: () => {
          if (typeof window !== 'undefined') {
            window.alert('Equipment created successfully');
          }
          void this.router.navigate(['/equipment']);
        },
        error: () => this.errorService.show('Failed to create equipment'),
      });
    }
  }

  remove(): void {
    if (this.equipment.id) {
      this.equipmentService.deleteEquipment(this.equipment.id).subscribe({
        next: () => {
          if (typeof window !== 'undefined') {
            window.alert('Equipment deleted successfully');
          }
          void this.router.navigate(['/equipment']);
        },
        error: () => this.errorService.show('Failed to delete equipment'),
      });
    }
  }
}
