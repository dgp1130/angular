import {Component, signal, inject} from '@angular/core';
import {WebMcpRegistry} from '@angular/core';

@Component({
  selector: 'app-counter',
  template: `
    <div>Hello, World!</div>

    <div>The count is: {{ count() }}.</div>
    <button (click)="increment()">Increment</button>
  `,
})
export class Counter {
  private readonly webMcp = inject(WebMcpRegistry);

  protected readonly count = signal(0);

  constructor() {
    this.webMcp.registerTool({
      name: 'get-count',
      description: 'Get the current count.',
      inputSchema: {type: 'object', properties: {}},
      execute: () => {
        return {content: [{type: 'text', text: this.count().toString()}]};
      },
    });

    this.webMcp.registerTool({
      name: 'increment',
      description: 'Increment the counter.',
      inputSchema: {type: 'object', properties: {}},
      execute: () => {
        this.increment();
        return {content: [{type: 'text', text: `Incremented to ${this.count()}.`}]};
      },
    });
  }

  protected increment(): void {
    this.count.update((c) => c + 1);
  }
}
