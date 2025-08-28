import { Routes } from '@angular/router';

export const customersRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./customer-list.component').then(m => m.CustomerListComponent)
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./customer-form.component').then(m => m.CustomerFormComponent)
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./customer-detail.component').then(m => m.CustomerDetailComponent)
  }
];
