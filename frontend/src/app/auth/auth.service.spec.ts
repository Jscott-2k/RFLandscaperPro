import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });

    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('should include credentials on login', () => {
    service.login({ email: 'test@example.com', password: 'pw' }).subscribe();

    const req = http.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.withCredentials).toBeTrue();
    req.flush({ access_token: 'token' });
  });

  it('should include credentials on refresh token', () => {
    service.refreshToken().subscribe();

    const req = http.expectOne(`${environment.apiUrl}/auth/refresh`);
    expect(req.request.withCredentials).toBeTrue();
    req.flush({ access_token: 'token' });
  });

  it('should include credentials on logout', () => {
    service.logout().subscribe();

    const req = http.expectOne(`${environment.apiUrl}/auth/logout`);
    expect(req.request.withCredentials).toBeTrue();
    req.flush(null);
  });
});
