import { Routes } from '@angular/router';

export const jobsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./jobs.component').then(m => m.JobsComponent)
  }
];
