import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { CustomersApiService } from '../api/customers-api.service';
import { CustomerService } from './customer.service';

describe('CustomerService', () => {
  let service: CustomerService;
  let apiSpy: jasmine.SpyObj<CustomersApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj<CustomersApiService>('CustomersApiService', ['getCustomers']);
    apiSpy.getCustomers.and.returnValue(of({ items: [], total: 0 }));

    TestBed.configureTestingModule({
      providers: [CustomerService, { provide: CustomersApiService, useValue: apiSpy }],
    });

    service = TestBed.inject(CustomerService);
  });

  it('should call CustomersApiService.getCustomers', () => {
    service.getCustomers().subscribe();
     
    expect(apiSpy.getCustomers).toHaveBeenCalled();
  });
});
