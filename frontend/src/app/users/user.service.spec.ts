import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { UserService } from './user.service';
import { ApiService } from '../api.service';

describe('UserService', () => {
  let service: UserService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj<ApiService>('ApiService', ['getUsers']);
    apiSpy.getUsers.and.returnValue(of([]));

    TestBed.configureTestingModule({
      providers: [UserService, { provide: ApiService, useValue: apiSpy }],
    });

    service = TestBed.inject(UserService);
  });

  it('should call ApiService.getUsers', () => {
    service.getUsers().subscribe();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(apiSpy.getUsers).toHaveBeenCalled();
  });
});
