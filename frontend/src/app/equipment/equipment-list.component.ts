import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Equipment, EquipmentService } from './equipment.service';

@Component({
  selector: 'app-equipment-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <h2>Equipment</h2>
    <input type="text" [(ngModel)]="filter" placeholder="Search equipment" />
    <ul>
      <li *ngFor="let item of filteredEquipment()" [routerLink]="[item.id]">
        {{ item.name }} - {{ item.status }}
      </li>
    </ul>
    <a [routerLink]="['new']">Add Equipment</a>
  `,
})
export class EquipmentListComponent {
  filter = '';
  equipments: Equipment[] = [];
  private equipmentService = inject(EquipmentService);

  ngOnInit(): void {
    this.equipmentService.getEquipmentList().subscribe((data) => (this.equipments = data));
  }

  filteredEquipment(): Equipment[] {
    const term = this.filter.toLowerCase();
    return this.equipments.filter((e) => e.name.toLowerCase().includes(term));
  }
}
