import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CustomerService } from './customer.service';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <ng-container *ngIf="customer$ | async as customer">
      <h2>{{ customer.name }}</h2>
      <p>Email: {{ customer.email }}</p>
      <p *ngIf="customer.phone">Phone: {{ customer.phone }}</p>
      <a [routerLink]="['/customers', customer.id, 'edit']">Edit</a>
    </ng-container>
  `,
})
export class CustomerDetailComponent {
  private route = inject(ActivatedRoute);
  private customerService = inject(CustomerService);

  customer$ = this.route.paramMap.pipe(
    switchMap((params) => this.customerService.getCustomer(Number(params.get('id')))),
  );
}
