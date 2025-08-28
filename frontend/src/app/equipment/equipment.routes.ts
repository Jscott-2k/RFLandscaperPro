import { Routes } from '@angular/router';

export const equipmentRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./equipment-list.component').then((m) => m.EquipmentListComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./equipment-detail.component').then((m) => m.EquipmentDetailComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./equipment-detail.component').then((m) => m.EquipmentDetailComponent),
  },
];
