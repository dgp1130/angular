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

type WebMcpToolDefinition = Omit<WebMcpTool, 'execute'>;

interface Handler {
  condition: (args: any) => boolean;
  execute: WebMcpTool['execute'];
}

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

  // TODO: Use name as key and assert same tool definition is provided?
  private readonly definitionMap = new Map<
    WebMcpToolDefinition,
    {
      handlers: Handler[];
    }
  >();

  declareToolHandler(
    definition: WebMcpToolDefinition,
    handler: Handler,
    destroyRef: DestroyRef = inject(DestroyRef),
  ): () => void {
    if (!modelContext) {
      return () => {};
    }

    const existingData = this.definitionMap.get(definition);
    const data = existingData ?? {handlers: [handler]};

    let cancelDestroyCb: () => void;
    let unregistered = false;
    const unregister = () => {
      // Only allow one unregistration per `declareTool` call, or else different handlers might unsubscribe each other.
      if (unregistered) return;
      unregistered = true;

      cancelDestroyCb();

      if (data.handlers.length > 1) {
        // More handlers exist, just remove the one.
        data.handlers.splice(data.handlers.indexOf(handler), 1);
      } else {
        // Last handler, unregister from modelContext.
        this.definitionMap.delete(definition);
        modelContext.unregisterTool(definition.name);
      }
    };
    cancelDestroyCb = destroyRef.onDestroy(unregister);

    if (existingData) {
      // Existing registration.
      existingData.handlers.push(handler);
      return unregister;
    }

    this.definitionMap.set(definition, data);

    // First registration
    try {
      modelContext.registerTool({
        ...definition,
        execute: (args) => {
          for (const handler of data.handlers) {
            if (handler.condition(args)) {
              return handler.execute(args);
            }
          }

          throw new Error('Tool not implemented, no handler matched the arguments.');
        },
      });
    } catch (e: any) {
      if (e?.message?.includes('Duplicate')) {
        console.error(
          `[WebMCP Registry] Failed to register duplicate tool: \`${definition.name}\`. Note: When rendering multiple instances of a component handling tools, pass dynamic values into the 'name' and 'description' keys to contextualize each instance uniquely.`,
        );
      }
      throw e;
    }

    return unregister;
  }
}
