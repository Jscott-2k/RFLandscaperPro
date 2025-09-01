import { type Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    loadComponent: () => import('./admin.component').then((m) => m.AdminComponent),
    path: '',
  },
];
