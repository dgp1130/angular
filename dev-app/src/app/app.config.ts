import {ApplicationConfig, provideBrowserGlobalErrorListeners} from '@angular/core';
import {provideRouter, withExperimentalAutoCleanupInjectors} from '@angular/router';

import {routes} from './app.routes';
import {provideHttpClient, withFetch} from '@angular/common/http';
import {provideExperimentalWebMcpForms} from '@angular/forms/signals';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withExperimentalAutoCleanupInjectors()),
    provideHttpClient(withFetch()),
    provideExperimentalWebMcpForms(),
  ],
};
