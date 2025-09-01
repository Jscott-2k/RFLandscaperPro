import { type Routes } from '@angular/router';

export const teamRoutes: Routes = [
  {
    loadComponent: () => import('./team.component').then((m) => m.TeamComponent),
    path: '',
  },
];
