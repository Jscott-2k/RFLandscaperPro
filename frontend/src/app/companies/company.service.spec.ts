import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CompanyService } from './company.service';
import { ApiService } from '../api.service';
import { Company } from '../api.service';

describe('CompanyService', () => {
  let service: CompanyService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj<ApiService>('ApiService', ['getCompanyProfile']);
    apiSpy.getCompanyProfile.and.returnValue(of({} as Company));

    TestBed.configureTestingModule({
      providers: [CompanyService, { provide: ApiService, useValue: apiSpy }],
    });

    service = TestBed.inject(CompanyService);
  });

  it('should call ApiService.getCompanyProfile', () => {
    service.getProfile().subscribe();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(apiSpy.getCompanyProfile).toHaveBeenCalled();
  });
});
