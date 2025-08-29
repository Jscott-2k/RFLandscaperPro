import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { UserService } from './user.service';
import { UsersApiService } from '../api/users-api.service';

describe('UserService', () => {
  let service: UserService;
  let apiSpy: jasmine.SpyObj<UsersApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj<UsersApiService>('UsersApiService', ['getUsers']);
    apiSpy.getUsers.and.returnValue(of([]));

    TestBed.configureTestingModule({
      providers: [UserService, { provide: UsersApiService, useValue: apiSpy }],
    });

    service = TestBed.inject(UserService);
  });

  it('should call UsersApiService.getUsers', () => {
    service.getUsers().subscribe();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(apiSpy.getUsers).toHaveBeenCalled();
  });
});
