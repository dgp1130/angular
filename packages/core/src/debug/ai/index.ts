/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {diGraphTool} from './di';
import {signalGraphTool} from './signals';

/**
 * Registers Angular AI tools with Chrome DevTools.
 *
 * This function listens for the `devtoolstooldiscovery` event and responds with
 * the available Angular-specific tools.
 */
export function registerAiTools(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('devtoolstooldiscovery', (event: any) => {
    const tools = [diGraphTool, signalGraphTool];
    const respondWith = (event as any).respondWith || (event as any).detail?.respondWith;
    if (typeof ngDevMode !== 'undefined' && ngDevMode && typeof respondWith !== 'function') {
      throw new Error(
        `AI Tool discovery failed: 'respondWith' is not available on the 'devtoolstooldiscovery' event.`,
      );
    }

    respondWith({
      name: 'Angular AI Tools',
      tools: tools,
    });
  });
}
