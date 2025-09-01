import { type Routes } from '@angular/router';

export const jobsRoutes: Routes = [
  {
    loadComponent: () => import('./job-list.component').then((m) => m.JobListComponent),
    path: '',
  },
  {
    loadComponent: () => import('./job-calendar.component').then((m) => m.JobCalendarComponent),
    path: 'calendar',
  },
  {
    loadComponent: () => import('./job-editor.component').then((m) => m.JobEditorComponent),
    path: ':id',
  },
];
