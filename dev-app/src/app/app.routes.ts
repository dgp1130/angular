import {Routes} from '@angular/router';
import {CounterComponent} from './counter';
import {Form} from './form';
import {Home} from './home';
import {inject, provideExperimentalWebMcpTools} from '@angular/core';
import {Counter} from './app';

export const routes: Routes = [
  {path: '', component: Home, pathMatch: 'full'},
  {
    path: 'counter',
    component: CounterComponent,
    providers: [
      provideExperimentalWebMcpTools([
        {
          name: 'counter-getCurrentValue',
          description: 'Provides the current value of the global counter.',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
            additionalProperties: false,
          },
          execute: () => {
            const counter = inject(Counter);
            return {content: [{type: 'text', text: `The count is: ${counter.count()}`}]};
          },
        },
        {
          name: 'counter-increment',
          description: 'Increments the global counter by the given amount.',
          inputSchema: {
            type: 'object',
            properties: {
              'amount': {
                type: 'number',
                description: 'Amount to increment by.',
              },
            },
            required: ['amount'],
            additionalProperties: false,
          },
          execute: (args) => {
            const {amount} = args as {amount: number};
            const counter = inject(Counter);
            const result = counter.increment(amount);
            return {content: [{type: 'text', text: `The count is now: ${result}.`}]};
          },
        },
      ]),
    ],
  },
  {path: 'form', component: Form},
];
