import {Component, inject} from '@angular/core';
import {Counter} from './app';

@Component({
  selector: 'app-counter',
  template: `
    <h2>Counter</h2>
    <div>
      <p>
        The count is: <strong>{{ counter.count() }}</strong>
      </p>
      <button type="button" (click)="decrement()">-</button>
      <button type="button" (click)="increment()">+</button>
    </div>
  `,
})
export class CounterComponent {
  protected readonly counter = inject(Counter);

  increment(): void {
    this.counter.increment(1);
  }

  decrement(): void {
    this.counter.increment(-1);
  }
}
