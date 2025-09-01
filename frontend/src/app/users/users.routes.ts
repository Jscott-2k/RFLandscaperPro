import { type Routes } from '@angular/router';

import { roleGuard } from '../auth/role.guard';

export const usersRoutes: Routes = [
  {
    canActivate: [roleGuard],
    data: { roles: ['company_admin'] },
    loadComponent: () => import('./user-list.component').then((m) => m.UserListComponent),
    path: '',
  },
  {
    canActivate: [roleGuard],
    data: { roles: ['company_admin'] },
    loadComponent: () => import('./user-form.component').then((m) => m.UserFormComponent),
    path: 'new',
  },
  {
    canActivate: [roleGuard],
    data: { roles: ['company_admin'] },
    loadComponent: () => import('./user-detail.component').then((m) => m.UserDetailComponent),
    path: ':id',
  },
];
