import { isPlatformServer } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  type ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  APP_INITIALIZER,
  PLATFORM_ID,
} from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ApiService } from './api.service';
import { routes } from './app.routes';
import { authInterceptor } from './auth.interceptor';
import { httpErrorInterceptor } from './http-error.interceptor';

function backendHealthInitializer(
  api: ApiService,
  router: Router,
  platformId: object,
): () => Promise<void> {
  return () => {
    if (isPlatformServer(platformId)) {
      return Promise.resolve();
    }
    return firstValueFrom(api.getHealth()).then(
      () => undefined,
      () => {
        void router.navigate(['/server-error']);
      },
    );
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withInterceptors([authInterceptor, httpErrorInterceptor])),
    {
      deps: [ApiService, Router, PLATFORM_ID],
      multi: true,
      provide: APP_INITIALIZER,
      useFactory: backendHealthInitializer,
    },
  ],
};
