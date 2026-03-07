import {effect, Injectable, signal, WebMcpToolRepository} from '@angular/core';

const ls = typeof localStorage !== 'undefined' ? localStorage : undefined;

@Injectable({providedIn: 'root'})
export class AuthenticatedUser implements WebMcpToolRepository {
  readonly name = signal(ls?.getItem('name') ?? 'develwithoutacause');

  constructor() {
    if (ls) {
      effect(() => {
        ls.setItem('name', this.name());
      });
    }
  }

  readonly mcpTools = [
    {
      name: 'get-user-name',
      description: 'Get the value of the user name.',
      inputSchema: {type: 'object', properties: {}},
      execute: () => {
        return {content: [{type: 'text', text: this.name()}]};
      },
    },
    {
      name: 'set-user-name',
      description: 'Set the user name.',
      inputSchema: {
        type: 'object',
        required: ['name'],
        properties: {
          'name': {
            type: 'string',
          },
        },
      },
      execute: (args: any) => {
        this.name.set(args.name);
        return {content: [{type: 'text', text: 'Updated.'}]};
      },
    },
  ];
}
