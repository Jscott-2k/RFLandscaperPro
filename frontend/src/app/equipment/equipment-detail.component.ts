import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EquipmentService, Equipment } from './equipment.service';

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

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.equipmentService.getEquipment(+id).subscribe((data) => (this.equipment = data));
    }
  }

  save(): void {
    if (this.equipment.id) {
      this.equipmentService.updateEquipment(this.equipment.id, this.equipment).subscribe(() => {
        void this.router.navigate(['/equipment']);
      });
    } else {
      this.equipmentService.createEquipment(this.equipment).subscribe(() => {
        void this.router.navigate(['/equipment']);
      });
    }
  }

  remove(): void {
    if (this.equipment.id) {
      this.equipmentService.deleteEquipment(this.equipment.id).subscribe(() => {
        void this.router.navigate(['/equipment']);
      });
    }
  }
}
