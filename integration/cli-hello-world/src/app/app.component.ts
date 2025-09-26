import {Component, LOCALE_ID} from '@angular/core';
import {CommonModule, registerLocaleData} from '@angular/common';
import localeFr from '@angular/common/locales/fr';

// adding this code to detect issues like https://github.com/angular/angular-cli/issues/10322
registerLocaleData(localeFr);

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [{provide: LOCALE_ID, useValue: 'fr'}],
  imports: [CommonModule],
})
export class AppComponent {
  title = 'cli-hello-world';
}
