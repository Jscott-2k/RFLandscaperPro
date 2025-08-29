import { Routes } from '@angular/router';

export const companiesRoutes: Routes = [
  {
    path: 'profile',
    loadComponent: () =>
      import('./company-profile.component').then(m => m.CompanyProfileComponent)
  },
  {
    path: 'workers',
    loadComponent: () =>
      import('./worker-list.component').then(m => m.WorkerListComponent)
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'profile'
  }
];

