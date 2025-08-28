import { Routes } from '@angular/router';

export const equipmentRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./equipment.component').then(m => m.EquipmentComponent)
  }
];
