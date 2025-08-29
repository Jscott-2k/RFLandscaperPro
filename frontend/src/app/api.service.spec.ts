import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { ErrorService } from './error.service';
import { environment } from '../environments/environment';

describe('ApiService company header', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService, ErrorService],
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should attach X-Company-ID header from storage', () => {
    localStorage.setItem('companyId', '1');
    service.getHealth().subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/health`);
    expect(req.request.headers.get('X-Company-ID')).toBe('1');
    req.flush({ status: 'ok' });
  });

  it('should update header when company changes', () => {
    localStorage.setItem('companyId', '1');
    service.getHealth().subscribe();
    const first = httpMock.expectOne(`${environment.apiUrl}/health`);
    expect(first.request.headers.get('X-Company-ID')).toBe('1');
    first.flush({ status: 'ok' });

    localStorage.setItem('companyId', '2');
    service.getHealth().subscribe();
    const second = httpMock.expectOne(`${environment.apiUrl}/health`);
    expect(second.request.headers.get('X-Company-ID')).toBe('2');
    second.flush({ status: 'ok' });
  });
});
