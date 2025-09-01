import { provideHttpClient, withInterceptors , HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../environments/environment';
import { ApiService } from './api.service';
import { authInterceptor } from './auth.interceptor';
import { ErrorService } from './error.service';

describe('ApiService auth interceptor', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ApiService,
        ErrorService,
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should attach auth token and company header', () => {
    localStorage.setItem('token', 'abc');
    localStorage.setItem('companyId', '1');
    service.getHealth().subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/health`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc');
    expect(req.request.headers.get('X-Company-ID')).toBe('1');
    req.flush({ status: 'ok' });
  });

  it('should not attach auth token or company header on login', () => {
    localStorage.setItem('token', 'abc');
    localStorage.setItem('companyId', '1');
    const http = TestBed.inject(HttpClient);
    http.post(`${environment.apiUrl}/auth/login`, { email: 'a', password: 'b' }).subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    expect(req.request.headers.has('X-Company-ID')).toBeFalse();
    req.flush({ access_token: 'xyz' });
  });
});
