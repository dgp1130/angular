import {DevtoolsToolDiscoveryEvent} from './tool_definitions';
import {diTool} from './di';

/** Register all AI tools to inspect local Angular state. */
export function registerAllTools(): void {
  window.addEventListener('devtoolstooldiscovery', (event: DevtoolsToolDiscoveryEvent) => {
    console.log('devtoolstooldiscovery event received:', event);
    event.respondWith({
      name: 'Angular DevTools',
      description: 'Provide runtime data about Angular applications on the page.',
      tools: [diTool],
    });
  });
}
