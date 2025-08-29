import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'customers/:id/edit',
    renderMode: RenderMode.Server,
  },
  {
    path: 'customers/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'equipment/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'jobs/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'contracts/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'users/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
