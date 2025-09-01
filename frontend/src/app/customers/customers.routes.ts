import { type Routes } from '@angular/router';

export const customersRoutes: Routes = [
  {
    loadComponent: () => import('./customer-list.component').then((m) => m.CustomerListComponent),
    path: '',
  },
  {
    loadComponent: () => import('./customer-form.component').then((m) => m.CustomerFormComponent),
    path: 'new',
  },
  {
    loadComponent: () => import('./customer-form.component').then((m) => m.CustomerFormComponent),
    path: ':id/edit',
  },
  {
    loadComponent: () =>
      import('./customer-detail.component').then((m) => m.CustomerDetailComponent),
    path: ':id',
  },
];
