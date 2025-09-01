import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { JobsApiService } from '../api/jobs-api.service';
import { JobsService } from './jobs.service';

describe('JobsService', () => {
  let service: JobsService;
  let apiSpy: jasmine.SpyObj<JobsApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj<JobsApiService>('JobsApiService', ['getJobs']);
    apiSpy.getJobs.and.returnValue(of({ items: [], total: 0 }));

    TestBed.configureTestingModule({
      providers: [JobsService, { provide: JobsApiService, useValue: apiSpy }],
    });

    service = TestBed.inject(JobsService);
  });

  it('should call JobsApiService.getJobs', () => {
    service.list().subscribe();
     
    expect(apiSpy.getJobs).toHaveBeenCalled();
  });
});
