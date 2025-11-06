import {
  ApplicationRef,
  Component,
  createComponent,
  inject,
  OnInit,
  signal,
  viewChild,
  ViewContainerRef,
} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {Foo} from './foo';
import {NgComponentOutlet} from '@angular/common';
import {Bar} from './bar';

@Component({
  selector: 'app-root',
  imports: [Bar, Foo, RouterOutlet, NgComponentOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private readonly appRef = inject(ApplicationRef);
  private readonly container = viewChild.required('container', {
    read: ViewContainerRef,
  });

  protected readonly title = signal('dev-app');
  protected readonly show = signal(false);
  protected readonly foo = Foo;
  protected readonly bars = signal([] as Array<{}>);

  ngOnInit(): void {
    const foo = createComponent(Foo, {environmentInjector: this.appRef.injector});
    this.container().insert(foo.hostView);
  }

  protected addBar(): void {
    this.bars.update((b) => [...b, {}]);
  }

  protected removeBar(): void {
    this.bars.update((b) => b.slice(0, b.length - 1));
  }
}
