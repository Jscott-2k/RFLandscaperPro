import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { ErrorService } from './error.service';
import { environment } from '../environments/environment';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';

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
});
