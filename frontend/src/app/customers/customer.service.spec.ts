import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CustomerService } from './customer.service';
import { ApiService } from '../api.service';

describe('CustomerService', () => {
  let service: CustomerService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj<ApiService>('ApiService', ['getCustomers']);
    apiSpy.getCustomers.and.returnValue(of({ items: [], total: 0 }));

    TestBed.configureTestingModule({
      providers: [CustomerService, { provide: ApiService, useValue: apiSpy }],
    });

    service = TestBed.inject(CustomerService);
  });

  it('should call ApiService.getCustomers', () => {
    service.getCustomers().subscribe();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(apiSpy.getCustomers).toHaveBeenCalled();
  });
});
