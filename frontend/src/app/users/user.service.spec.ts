import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { UsersApiService } from '../api/users-api.service';
import { UserService } from './user.service';

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
     
    expect(apiSpy.getUsers).toHaveBeenCalled();
  });
});
