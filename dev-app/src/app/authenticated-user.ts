import {effect, Injectable, signal, WebMcpToolRepository} from '@angular/core';

const ls = typeof localStorage !== 'undefined' ? localStorage : undefined;

@Injectable({providedIn: 'root'})
export class AuthenticatedUser implements WebMcpToolRepository {
  readonly name = signal(ls?.getItem('name') ?? 'Devel');

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
      description: 'Set the value of the user name.',
      inputSchema: {type: 'object', properties: {value: {type: 'string'}}},
      execute: ({value}: {value: string}) => {
        this.name.set(value);
        return {content: [{type: 'text', text: `Set user name to ${value}.`}]};
      },
    },
  ];
}
