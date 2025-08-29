import { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { AdminGuard } from './auth/admin.guard';
import { RootRedirectGuard } from './auth/root-redirect.guard';
import { roleGuard } from './auth/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'signup/company',
    loadComponent: () =>
      import('./auth/signup-owner/signup-owner.component').then((m) => m.SignupOwnerComponent),
  },
  {
    path: 'verify',
    loadComponent: () => import('./auth/verify/verify.component').then((m) => m.VerifyComponent),
  },
  {
    path: 'invite/accept',
    loadComponent: () =>
      import('./invitations/accept-invitation.component').then((m) => m.AcceptInvitationComponent),
  },
  {
    path: 'customers',
    canActivate: [AuthGuard],
    loadChildren: () => import('./customers/customers.routes').then((m) => m.customersRoutes),
  },
  {
    path: 'equipment',
    canActivate: [AuthGuard],
    loadChildren: () => import('./equipment/equipment.routes').then((m) => m.equipmentRoutes),
  },
  {
    path: 'jobs',
    canActivate: [AuthGuard],
    loadChildren: () => import('./jobs/jobs.routes').then((m) => m.jobsRoutes),
  },
  {
    path: 'contracts',
    canActivate: [AuthGuard],
    loadChildren: () => import('./contracts/contracts.routes').then((m) => m.contractsRoutes),
  },
  {
    path: 'users',
    canActivate: [AuthGuard],
    loadChildren: () => import('./users/users.routes').then((m) => m.usersRoutes),
  },
  {
    path: 'company',
    canActivate: [AuthGuard],
    loadChildren: () => import('./companies/companies.routes').then((m) => m.companiesRoutes),
  },
  {
    path: 'team',
    canActivate: [AuthGuard, roleGuard],
    data: { roles: ['owner', 'admin'] },
    loadChildren: () => import('./team/team.routes').then((m) => m.teamRoutes),
  },
  {
    path: 'admin',
    canActivate: [AdminGuard],
    loadChildren: () => import('./admin/admin.routes').then((m) => m.adminRoutes),
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadChildren: () => import('./dashboard/dashboard.routes').then((m) => m.dashboardRoutes),
  },
  {
    path: '',
    canActivate: [RootRedirectGuard],
    loadComponent: () => import('./auth/login/login.component').then((m) => m.LoginComponent),
    pathMatch: 'full',
  },
];
