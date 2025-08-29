import { Routes } from '@angular/router';

export const contractsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./contract-list.component').then((m) => m.ContractListComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./contract-editor.component').then((m) => m.ContractEditorComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./contract-editor.component').then((m) => m.ContractEditorComponent),
  },
];
