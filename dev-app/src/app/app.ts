import {Component, signal} from '@angular/core';
import {Counter} from './counter';
import {ViewUser} from './view-user';
import {UpdateUserForm} from './update-user-form';
import {GlobalUsername} from './global-username';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  imports: [GlobalUsername, Counter, ViewUser, UpdateUserForm],
})
export class App {
  protected readonly showCounter = signal(true);

  protected toggle(): void {
    this.showCounter.update((s) => !s);
  }
}
