import { type Routes } from '@angular/router';

import { AdminGuard } from './auth/admin.guard';
import { AuthGuard } from './auth/auth.guard';
import { roleGuard } from './auth/role.guard';
import { RootRedirectGuard } from './auth/root-redirect.guard';

export const routes: Routes = [
  {
    loadComponent: () =>
      import('./server-error/server-error.component').then((m) => m.ServerErrorComponent),
    path: 'server-error',
  },
  {
    loadComponent: () => import('./auth/login/login.component').then((m) => m.LoginComponent),
    path: 'login',
  },
  {
    loadComponent: () =>
      import('./auth/signup-owner/signup-owner.component').then((m) => m.SignupOwnerComponent),
    path: 'signup/company',
  },
  {
    loadComponent: () => import('./auth/verify/verify.component').then((m) => m.VerifyComponent),
    path: 'verify',
  },
  {
    loadComponent: () =>
      import('./invitations/accept-invitation.component').then((m) => m.AcceptInvitationComponent),
    path: 'invite/accept',
  },
  {
    canActivate: [AuthGuard],
    loadChildren: () => import('./customers/customers.routes').then((m) => m.customersRoutes),
    path: 'customers',
  },
  {
    canActivate: [AuthGuard],
    loadChildren: () => import('./equipment/equipment.routes').then((m) => m.equipmentRoutes),
    path: 'equipment',
  },
  {
    canActivate: [AuthGuard],
    loadChildren: () => import('./jobs/jobs.routes').then((m) => m.jobsRoutes),
    path: 'jobs',
  },
  {
    canActivate: [AuthGuard],
    loadChildren: () => import('./contracts/contracts.routes').then((m) => m.contractsRoutes),
    path: 'contracts',
  },
  {
    canActivate: [AuthGuard],
    loadChildren: () => import('./users/users.routes').then((m) => m.usersRoutes),
    path: 'users',
  },
  {
    canActivate: [AuthGuard],
    loadChildren: () => import('./companies/companies.routes').then((m) => m.companiesRoutes),
    path: 'company',
  },
  {
    canActivate: [AuthGuard, roleGuard],
    data: { roles: ['company_owner', 'company_admin'] },
    loadChildren: () => import('./team/team.routes').then((m) => m.teamRoutes),
    path: 'team',
  },
  {
    canActivate: [AdminGuard],
    loadChildren: () => import('./admin/admin.routes').then((m) => m.adminRoutes),
    path: 'admin',
  },
  {
    canActivate: [AuthGuard],
    loadChildren: () => import('./dashboard/dashboard.routes').then((m) => m.dashboardRoutes),
    path: 'dashboard',
  },
  {
    canActivate: [RootRedirectGuard],
    loadComponent: () => import('./auth/login/login.component').then((m) => m.LoginComponent),
    path: '',
    pathMatch: 'full',
  },
];
