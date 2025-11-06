import {createApplication} from '@angular/platform-browser';
import {App} from './app/app';
import {appConfig} from './app/app.config';

(async () => {
  const appRef = await createApplication(appConfig);
  const container = document.getElementById('container')!;
  const root = container.shadowRoot!.querySelector('app-root');
  appRef.bootstrap(App, root);
})();
