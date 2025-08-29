import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  APP_INITIALIZER,
} from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';
import { routes } from './app.routes';
import { ApiService } from './api.service';
import { firstValueFrom } from 'rxjs';

function backendHealthInitializer(api: ApiService, router: Router): () => Promise<void> {
  return () =>
    firstValueFrom(api.getHealth()).then(
      () => undefined,
      () => {
        void router.navigate(['/server-error']);
      },
    );
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withInterceptors([authInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: backendHealthInitializer,
      deps: [ApiService, Router],
      multi: true,
    },
  ],
};
