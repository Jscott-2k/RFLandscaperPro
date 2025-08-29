import { Routes } from '@angular/router';

export const jobsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./job-list.component').then((m) => m.JobListComponent),
  },
  {
    path: 'calendar',
    loadComponent: () => import('./job-calendar.component').then((m) => m.JobCalendarComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./job-editor.component').then((m) => m.JobEditorComponent),
  },
];
