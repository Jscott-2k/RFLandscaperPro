import { type Routes } from '@angular/router';

export const companiesRoutes: Routes = [
  {
    loadComponent: () =>
      import('./company-profile.component').then((m) => m.CompanyProfileComponent),
    path: 'profile',
  },
  {
    loadComponent: () => import('./worker-list.component').then((m) => m.WorkerListComponent),
    path: 'workers',
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'profile',
  },
];
