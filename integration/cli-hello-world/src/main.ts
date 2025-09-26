import {createApplication} from '@angular/platform-browser';

import {AppComponent} from './app/app.component';

const root = document.querySelector('#root')!;
const appRoot = root.shadowRoot.firstElementChild!;

(async () => {
  const appRef = await createApplication();
  appRef.bootstrap(AppComponent, appRoot);
})();
