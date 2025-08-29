import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Company Admin Area</h2>
    <p>Only company admins can see this page.</p>
  `,
})
export class AdminComponent {}
