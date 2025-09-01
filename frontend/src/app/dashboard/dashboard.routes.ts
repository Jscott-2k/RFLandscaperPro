import { type Routes } from '@angular/router';

export const dashboardRoutes: Routes = [
  {
    loadComponent: () => import('./dashboard.component').then((m) => m.DashboardComponent),
    path: '',
  },
];
