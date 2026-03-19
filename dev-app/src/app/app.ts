import {Component, signal, computed, inject, Injectable, effect} from '@angular/core';
import {RouterOutlet} from '@angular/router';

@Injectable({providedIn: 'root'})
export class RootService {
  count = signal(0);
  doubleCount = computed(() => this.count() * 2);

  increment() {
    this.count.update((c) => c + 1);
  }
}

@Injectable()
export class LocalService {
  localValue = signal('local-secret');
  derivedValue = computed(() => `Modified: ${this.localValue()}`);
}

@Component({
  selector: 'child-comp',
  standalone: true,
  template: `
    <div class="child">
      <h3>Child Component</h3>
      <p>Root Count: {{ rootService.count() }}</p>
      <p>Local Value: {{ localService.localValue() }}</p>
      <button (click)="rootService.increment()">Increment Root</button>
    </div>
  `,
  providers: [LocalService],
})
export class ChildComp {
  rootService = inject(RootService);
  localService = inject(LocalService);
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ChildComp],
  providers: [LocalService],
  template: `
    <h1>Welcome to the dev app!</h1>
    <div class="parent">
      <h2>Parent</h2>
      <p>Double Count: {{ rootService.doubleCount() }}</p>
      <p>App Local Value: {{ localService.localValue() }}</p>
      <input #box (input)="localService.localValue.set(box.value)" value="local-secret" />
      <hr />
      <child-comp />
    </div>
    <router-outlet />
  `,
})
export class App {
  rootService = inject(RootService);
  localService = inject(LocalService);

  constructor() {
    effect(() => {
      console.log('Root count changed:', this.rootService.count());
    });
  }
}
