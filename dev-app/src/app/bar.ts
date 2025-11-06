import {Component} from '@angular/core';

@Component({
  selector: 'app-dep',
  template: `<p>I'm a dependency component!</p>`,
  styles: `
    :host { display: block; }
    p { color: orange; }
  `,
})
export class Dep {}

@Component({
  selector: 'app-bar',
  template: `
    <div>Hello from bar</div>
    <app-dep />
  `,
  styles: `
    div { color: green; }
  `,
  imports: [Dep]
})
export class Bar {}
