import {Component, inject, input, signal, WebMcpRegistry, WebMcpTool} from '@angular/core';

const followUserTool: Omit<WebMcpTool, 'execute'> = {
  name: 'follow-user',
  description: 'Follow a user.',
  inputSchema: {type: 'object', properties: {handle: {type: 'string'}}},
};

const getFollowableUsersTool: Omit<WebMcpTool, 'execute'> = {
  name: 'get-followable-users',
  description: 'Get a list of users that can be followed.',
  inputSchema: {type: 'object', properties: {}},
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

    <span>{{ handle() }}</span>
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

  readonly handle = input.required<string>();

  protected readonly isFollowing = signal(false);

  constructor() {
    this.mcpRegistry.declareAggregatedToolHandler(getFollowableUsersTool, () => {
      return {
        content: [
          {
            type: 'text',
            text: `You are ${this.isFollowing() ? 'following' : 'not following'} ${this.handle()}.`,
          },
        ],
      };
    });

    this.mcpRegistry.declareExclusiveToolHandler(followUserTool, {
      match: (params) => {
        if (params.handle === this.handle()) return true;

        return `I support name === '${this.handle()}'`;
      },
      execute: () => {
        this.isFollowing.set(true);
        return {content: [{type: 'text', text: `Followed ${this.handle()}.`}]};
      },
    });
  }

  protected toggleFollow(): void {
    this.isFollowing.update((s) => !s);
  }
}
