import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { environment } from '../../environments/environment';
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

  it('should reflect authentication status based on token presence', () => {
    expect(service.isAuthenticated()).toBeFalse();
    service.handleAuth({ access_token: 'abc' });
    expect(service.isAuthenticated()).toBeTrue();
  });
});

describe('AuthService HTTP requests', () => {
  let service: AuthService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });
    service = TestBed.inject(AuthService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
    sessionStorage.clear();
    TestBed.resetTestingModule();
  });

  it('should send login request with credentials', () => {
    service.login({ email: 'a', password: 'b' }).subscribe();

    const req = controller.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBeTrue();
    req.flush({ access_token: 'token' });
  });

  it('should send refresh request with credentials', () => {
    service.refreshToken().subscribe();

    const req = controller.expectOne(`${environment.apiUrl}/auth/refresh`);
    expect(req.request.withCredentials).toBeTrue();
    req.flush({ access_token: 'token' });
  });

  it('should send logout request with credentials', () => {
    service.logout().subscribe();

    const req = controller.expectOne(`${environment.apiUrl}/auth/logout`);
    expect(req.request.withCredentials).toBeTrue();
    req.flush({});
  });
});
