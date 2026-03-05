import {Component, inject, signal} from '@angular/core';
import {Counter} from './counter';
import {AuthenticatedUser} from './authenticated-user';
import {ViewUser} from './view-user';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  imports: [Counter, ViewUser],
})
export class App {
  protected readonly user = inject(AuthenticatedUser);

  protected readonly showCounter = signal(true);

  protected toggle(): void {
    this.showCounter.update((s) => !s);
  }
}
