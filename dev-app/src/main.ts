import {bootstrapApplication} from '@angular/platform-browser';
import {App} from './app/app';
import {config as appConfig} from './app/app.config.browser';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
