import { type Routes } from '@angular/router';

export const equipmentRoutes: Routes = [
  {
    loadComponent: () => import('./equipment-list.component').then((m) => m.EquipmentListComponent),
    path: '',
  },
  {
    loadComponent: () =>
      import('./equipment-detail.component').then((m) => m.EquipmentDetailComponent),
    path: 'new',
  },
  {
    loadComponent: () =>
      import('./equipment-detail.component').then((m) => m.EquipmentDetailComponent),
    path: ':id',
  },
];
