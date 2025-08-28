import { Routes } from '@angular/router';

export const customersRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./customers.component').then(m => m.CustomersComponent)
  }
];
