import { type Routes } from '@angular/router';

export const contractsRoutes: Routes = [
  {
    loadComponent: () => import('./contract-list.component').then((m) => m.ContractListComponent),
    path: '',
  },
  {
    loadComponent: () =>
      import('./contract-editor.component').then((m) => m.ContractEditorComponent),
    path: 'new',
  },
  {
    loadComponent: () =>
      import('./contract-editor.component').then((m) => m.ContractEditorComponent),
    path: ':id',
  },
];
