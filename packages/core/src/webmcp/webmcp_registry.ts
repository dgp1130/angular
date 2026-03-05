/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Injectable, inject} from '../di';
import {DestroyRef} from '../linker/destroy_ref';
import type {WebMcpTool} from './webmcp_types';

const modelContext = navigator?.modelContext;

/**
 * Service to manage WebMCP tool registrations defensively preventing
 * hydration gaps mapping lifecycles natively.
 */
@Injectable({providedIn: 'root'})
export class WebMcpRegistry {
  registerTool(tool: WebMcpTool, destroyRef: DestroyRef = inject(DestroyRef)): () => void {
    if (!modelContext) {
      return () => {};
    }

    try {
      modelContext.registerTool(tool);
    } catch (e: any) {
      if (e?.message?.includes('Duplicate')) {
        console.error(
          `[WebMCP Registry] Failed to register duplicate tool: ${tool.name}. Note: When rendering multiple instances of a component handling tools, pass dynamic values into the 'name' and 'description' keys to contextualize each instance uniquely.`,
        );
      }
      throw e;
    }

    const unregister = () => void modelContext.unregisterTool(tool.name);
    const cancelDestroyCb = destroyRef.onDestroy(unregister);

    return () => {
      unregister();
      cancelDestroyCb();
    };
  }
}
