import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { CompaniesApiService, type Company } from '../api/companies-api.service';
import { CompanyService } from './company.service';

describe('CompanyService', () => {
  let service: CompanyService;
  let apiSpy: jasmine.SpyObj<CompaniesApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj<CompaniesApiService>('CompaniesApiService', [
      'getCompanyProfile',
    ]);
    apiSpy.getCompanyProfile.and.returnValue(of({} as Company));

    TestBed.configureTestingModule({
      providers: [CompanyService, { provide: CompaniesApiService, useValue: apiSpy }],
    });

    service = TestBed.inject(CompanyService);
  });

  it('should call CompaniesApiService.getCompanyProfile', () => {
    service.getProfile().subscribe();
     
    expect(apiSpy.getCompanyProfile).toHaveBeenCalled();
  });
});
