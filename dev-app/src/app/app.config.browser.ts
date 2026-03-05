import {mergeApplicationConfig, ApplicationConfig} from '@angular/core';
import {appConfig} from './app.config';
import {provideWebMcp} from '@angular/core';
import {AuthenticatedUser} from './authenticated-user';

const browserConfig: ApplicationConfig = {
  providers: [provideWebMcp([AuthenticatedUser])],
};

export const config = mergeApplicationConfig(appConfig, browserConfig);
