import { Routes } from '@angular/router';
import { roleGuard } from '../auth/role.guard';

export const usersRoutes: Routes = [
  {
    path: '',
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
    loadComponent: () => import('./user-list.component').then((m) => m.UserListComponent),
  },
  {
    path: 'new',
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
    loadComponent: () => import('./user-form.component').then((m) => m.UserFormComponent),
  },
  {
    path: ':id',
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
    loadComponent: () => import('./user-detail.component').then((m) => m.UserDetailComponent),
  },
];
