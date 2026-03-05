import {ApplicationConfig, provideBrowserGlobalErrorListeners, provideWebMcp} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {provideClientHydration, withEventReplay} from '@angular/platform-browser';
import {provideHttpClient, withFetch} from '@angular/common/http';
import {AuthenticatedUser} from './authenticated-user';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideClientHydration(withEventReplay()),
    AuthenticatedUser,
    provideWebMcp([AuthenticatedUser]),
  ],
};
