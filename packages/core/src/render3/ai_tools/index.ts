import {DevtoolsToolDiscoveryEvent} from './tool_definitions';

/** Register all AI tools to inspect local Angular state. */
export function registerAllTools(): void {
  window.addEventListener('devtoolstooldiscovery', (event: DevtoolsToolDiscoveryEvent) => {
    console.log('devtoolstooldiscovery event received:', event);
    event.respondWith({
      name: 'Angular DevTools',
      description: 'Provide runtime data about Angular applications on the page.',
      tools: [
        {
          name: 'add',
          description: 'Adds two numbers.',
          inputSchema: {
            type: 'object',
            properties: {
              a: {type: 'number'},
              b: {type: 'number'},
            },
            required: ['a', 'b'],
          },
          execute: ({a, b}: {a: number; b: number}) => {
            return a + b;
          },
        },
      ],
    });
  });
}
