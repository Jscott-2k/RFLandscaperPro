import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { AuthService } from './auth.service';

describe('AuthService token management', () => {
  let service: AuthService;
  let httpSpy: jasmine.SpyObj<HttpClient>;

  function createService(): AuthService {
    httpSpy = jasmine.createSpyObj<HttpClient>('HttpClient', ['post']);
    httpSpy.post.and.returnValue(of(void 0));
    TestBed.configureTestingModule({
      providers: [AuthService, { provide: HttpClient, useValue: httpSpy }],
    });
    return TestBed.inject(AuthService);
  }

  beforeEach(() => {
    sessionStorage.clear();
    service = createService();
  });

  afterEach(() => {
    sessionStorage.clear();
    TestBed.resetTestingModule();
  });

  it('should clear token on logout', () => {
    service.handleAuth({ access_token: 'abc' });
    expect(service.getToken()).toBe('abc');

    service.logout().subscribe();
    expect(sessionStorage.getItem('token')).toBeNull();
    expect(service.getToken()).toBeNull();
  });

  it('should not persist token across browser restarts', () => {
    service.handleAuth({ access_token: 'abc' });
    expect(sessionStorage.getItem('token')).toBe('abc');

    sessionStorage.clear();
    TestBed.resetTestingModule();
    service = createService();
    expect(service.getToken()).toBeNull();

  });
});
