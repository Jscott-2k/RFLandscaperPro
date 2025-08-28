import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: 'customers',
    loadChildren: () => import('./customers/customers.routes').then(m => m.customersRoutes)
  },
  {
    path: 'equipment',
    loadChildren: () => import('./equipment/equipment.routes').then(m => m.equipmentRoutes)
  },
  {
    path: 'jobs',
    loadChildren: () => import('./jobs/jobs.routes').then(m => m.jobsRoutes)
  },
  {
    path: 'users',
    loadChildren: () => import('./users/users.routes').then(m => m.usersRoutes)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./dashboard/dashboard.routes').then(m => m.dashboardRoutes)
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];
