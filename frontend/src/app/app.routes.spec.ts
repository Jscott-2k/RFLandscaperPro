import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { routes } from './app.routes';
import { AuthService } from './auth/auth.service';

describe('App Routes', () => {
  it('redirects unauthenticated dashboard access to login', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        { provide: AuthService, useValue: { isAuthenticated: () => false } },
      ],
    });

    const router = TestBed.inject(Router);
    await router.navigateByUrl('/dashboard');

    expect(router.url).toBe('/login');
  });
});
