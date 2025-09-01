import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CustomerService } from './customer.service';

@Component({
  imports: [CommonModule, RouterLink],
  selector: 'app-customer-list',
  standalone: true,
  template: `
    <h2>Customers</h2>
    <table *ngIf="customers$ | async as customers">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Phone</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let c of customers">
          <td>
            <a [routerLink]="['/customers', c.id]">{{ c.name }}</a>
          </td>
          <td>{{ c.email }}</td>
          <td>{{ c.phone }}</td>
        </tr>
      </tbody>
    </table>
    <a [routerLink]="['/customers', 'new']">Add Customer</a>
  `,
})
export class CustomerListComponent {
  private customerService = inject(CustomerService);
  customers$ = this.customerService.getCustomers();
}
