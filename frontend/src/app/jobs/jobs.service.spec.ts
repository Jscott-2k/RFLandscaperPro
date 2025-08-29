import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { JobsService } from './jobs.service';
import { JobsApiService } from '../api/jobs-api.service';

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
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(apiSpy.getJobs).toHaveBeenCalled();
  });
});
