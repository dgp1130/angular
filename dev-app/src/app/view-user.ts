import {Component, inject, input, signal, WebMcpRegistry, WebMcpTool} from '@angular/core';

const followUserTool: Omit<WebMcpTool, 'execute'> = {
  name: 'follow-user',
  description: 'Follow a user.',
  inputSchema: {type: 'object', properties: {name: {type: 'string'}}},
};

@Component({
  selector: 'app-view-user',
  template: `
    @if (isFollowing()) {
      <span
        style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: blue; margin-right: 4px;"
      ></span>
    } @else {
      <span style="display: inline-block; width: 8px; height: 8px; margin-right: 4px;"></span>
    }

    <span>{{ name() }}</span>
    <button (click)="toggleFollow()">{{ isFollowing() ? 'Unfollow' : 'Follow' }}</button>
  `,
  styles: `
    button {
      margin-left: 4px;
    }
  `,
})
export class ViewUser {
  private readonly mcpRegistry = inject(WebMcpRegistry);

  name = input.required<string>();

  protected readonly isFollowing = signal(false);

  constructor() {
    this.mcpRegistry.declareToolHandler(followUserTool, {
      condition: (params) => params.name === this.name(),
      execute: () => {
        this.isFollowing.set(true);
        return {content: [{type: 'text', text: `Followed ${this.name()}.`}]};
      },
    });
  }

  protected toggleFollow(): void {
    this.isFollowing.update((s) => !s);
  }
}
