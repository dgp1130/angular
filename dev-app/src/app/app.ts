import {
  afterNextRender,
  ApplicationRef,
  Component,
  inject,
  PendingTasks,
  signal,
} from '@angular/core';
import {RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly pendingTasks = inject(PendingTasks);
  private readonly appRef = inject(ApplicationRef);

  protected readonly title = signal('dev-app');

  constructor() {
    afterNextRender(() => {
      this.pendingTasks.run(() => new Promise(() => {}));
    });

    this.appRef.whenStable().then(() => {
      console.log('Application is stable!');
    });
  }
}
