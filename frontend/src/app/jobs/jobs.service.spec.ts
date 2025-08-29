import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { JobsService } from './jobs.service';
import { ApiService } from '../api.service';

describe('JobsService', () => {
  let service: JobsService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj<ApiService>('ApiService', ['getJobs']);
    apiSpy.getJobs.and.returnValue(of({ items: [], total: 0 }));

    TestBed.configureTestingModule({
      providers: [JobsService, { provide: ApiService, useValue: apiSpy }],
    });

    service = TestBed.inject(JobsService);
  });

  it('should call ApiService.getJobs', () => {
    service.list().subscribe();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(apiSpy.getJobs).toHaveBeenCalled();
  });
});
