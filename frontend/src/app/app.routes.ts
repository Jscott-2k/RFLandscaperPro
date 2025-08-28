import { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'customers',
    canActivate: [AuthGuard],
    loadChildren: () => import('./customers/customers.routes').then(m => m.customersRoutes)
  },
  {
    path: 'equipment',
    canActivate: [AuthGuard],
    loadChildren: () => import('./equipment/equipment.routes').then(m => m.equipmentRoutes)
  },
  {
    path: 'jobs',
    canActivate: [AuthGuard],
    loadChildren: () => import('./jobs/jobs.routes').then(m => m.jobsRoutes)
  },
  {
    path: 'users',
    canActivate: [AuthGuard],
    loadChildren: () => import('./users/users.routes').then(m => m.usersRoutes)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
