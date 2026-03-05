/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Injectable, inject} from '../di';
import {DestroyRef} from '../linker/destroy_ref';
import type {PromiseOr, WebMcpTool, WebMcpToolResult} from './webmcp_types';

const modelContext = navigator?.modelContext;

export type WebMcpToolDefinition = Omit<WebMcpTool, 'execute'>;
export type WebMcpExclusiveToolHandler = WebMcpToolDefinition & {
  executeOnNoMatch?: (handlerSupportMessages: string[], args: any) => WebMcpToolResult;
};
export type WebMcpAggregatedToolDefinition = WebMcpToolDefinition & {
  aggregator?: WebMcpResultAggregator;
};
export type WebMcpResultAggregator = (results: WebMcpToolResult[]) => WebMcpToolResult;

export type WebMcpAggregatedHandler = WebMcpTool['execute'];
export interface WebMcpExclusiveHandler {
  match: (args: any) => PromiseOr<true | string>;
  execute: WebMcpTool['execute'];
}

enum HandlerType {
  Exclusive = 'exclusive',
  Aggregated = 'aggregated',
}

type DiscriminatedHandlers =
  | {
      type: HandlerType.Aggregated;
      handlers: WebMcpAggregatedHandler[];
    }
  | {
      type: HandlerType.Exclusive;
      handlers: WebMcpExclusiveHandler[];
    };

/**
 * Service to manage WebMCP tool registrations defensively preventing
 * hydration gaps mapping lifecycles natively.
 */
@Injectable({providedIn: 'root'})
export class WebMcpRegistry {
  // TODO: Use name as key and assert same tool definition is provided?
  private readonly definitionMap = new Map<WebMcpToolDefinition, DiscriminatedHandlers>();

  /**
   * Declares a WebMCP tool.
   *
   * This tool is registered onto the given {@link DestroyRef} or inferred from the current injection context. It is
   * automatically unregistered when the {@link DestroyRef} is triggered / injection context is destroyed.
   *
   * @param tool The tool to register and execute when invoked by an AI agent.
   * @param destroyRef Optional {@link DestroyRef} which will unregister the tool when triggered. When not provided,
   *     `inject(DestroyRef)` is used.
   * @returns A function that can be called to manually unregister the tool.
   */
  declareTool(tool: WebMcpTool, destroyRef?: DestroyRef): () => void {
    return this.declareExclusiveToolHandler(
      tool,
      {match: () => true, execute: tool.execute.bind(tool)},
      destroyRef,
    );
  }

  /**
   * Declares a WebMCP tool which supports multiple handlers, each of which may respond with data and the full set will
   * be aggregated together into a single response.
   *
   * This tool is registered onto the given {@link DestroyRef} or inferred from the current injection context. It is
   * automatically unregistered when the {@link DestroyRef} is triggered / injection context is destroyed.
   *
   * The provided tool definition can support multiple handlers by calling {@link declareAggregatedToolHandler} multiple
   * times with the same tool definition. Callers must provide the same definition _object reference_, not just the same
   * tool name.
   *
   * When the tool is executed, all handlers are executed and their results are aggregated together into a single
   * response using {@link WebMcpAggregatedToolDefinition.prototype.aggregator}. This allows multiple locations in code
   * to implement the same WebMCP tool for different data sets. The example use case for this is a component which is
   * rendered multiple times. Each instance of a component may provide only a subset of the full data set relying on the
   * WebMCP to join those results into a single response.
   *
   * If the handler cannot support the given arguments, it should return a string explaining what arguments in *can*
   * support in plain text. If no handler matches the given request, these strings are returned to the AI agent so
   * that it may try again with different arguments.
   *
   *
   * @example
   * ```typescript
   * const definition = {
   *   name: 'get-users',
   *   description: 'Get a list of users.',
   *   inputSchema: {type: 'object', properties: {}},
   * };
   *
   * @Component({ ... })
   * class MyComponent {
   *   readonly name = input.required<string>();
   *
   *   constructor() {
   *     this.declareAggregatedToolHandler(definition, () => {
   *       return {content: [{type: 'text', text: `User: ${this.name()}`}]};
   *     });
   *   }
   * }
   * ```
   *
   * If `{@link WebMcpAggregatedToolDefinition.prototype.aggregator}` is not provided, then `{@link concatAggregator}`
   * is used by default.
   *
   * @param definition The tool definition to register.
   * @param handler The handler to execute when the tool is invoked by an AI agent.
   * @param destroyRef Optional {@link DestroyRef} which will unregister the tool when triggered. When not provided,
   *     `inject(DestroyRef)` is used.
   * @returns A function that can be called to manually unregister the tool.
   */
  declareAggregatedToolHandler(
    definition: WebMcpAggregatedToolDefinition,
    handler: WebMcpAggregatedHandler,
    destroyRef?: DestroyRef,
  ): () => void {
    return this.declareToolInternal(
      definition,
      handler,
      HandlerType.Aggregated,
      async (handlers, args) => {
        const results = await Promise.all(handlers.map((handler) => handler(args)));
        const aggregator = definition.aggregator ?? concatAggregator;
        return aggregator(results);
      },
      destroyRef,
    );
  }

  /**
   * Declares a WebMCP tool which supports multiple handlers, one of which will be used exclusively to handle the
   * request.
   *
   * This tool is registered onto the given {@link DestroyRef} or inferred from the current injection context. It is
   * automatically unregistered when the {@link DestroyRef} is triggered / injection context is destroyed.
   *
   * The provided tool definition can support multiple handlers by calling {@link declareExclusiveToolHandler} multiple
   * times with the same tool definition. Callers must provide the same definition _object reference_, not just the same
   * tool name.
   *
   * When the tool is executed, each declared handler has its `match` invoked. The first handler which returns `true`
   * is executed and its result is returend to the AI agent. This allows multiple locations in code to implement the
   * same WebMCP tool for different data sets. The example use case for this is a component which is rendered multiple
   * times. Each instance of a component may support interacting with only its specific set of data, so the WebMCP tool
   * needs to decide which component's handler to use for a given request.
   *
   * If the handler cannot support the given arguments, it should return a string explaining what arguments in *can*
   * support in plain text. If no handler matches the given request, these strings are returned to the AI agent so
   * that it may try again with different arguments.
   *
   *
   * @example
   * ```typescript
   * const definition = {
   *   name: 'get-user-age',
   *   description: 'Get the age of a user.',
   *   inputSchema: {type: 'object', properties: {name: {type: 'string'}}},
   * };
   *
   * @Component({ ... })
   * class MyComponent {
   *   readonly name = input.required<string>();
   *   readonly age = input.required<number>();
   *
   *   constructor() {
   *     this.declareExclusiveToolHandler(definition, {
   *       // I can only handle `this.name()`, another component will have to handle other names.
   *       match: (params) => {
   *         if (params.name === this.name()) return true;
   *
   *         return `I support name === '${this.name()}'.`;
   *       }
   *       execute: () => {
   *         return {content: [{type: 'text', text: `Age: ${this.age()}`}]};
   *       },
   *     });
   *   }
   * }
   * ```
   *
   * If `{@link WebMcpExclusiveToolHandler.prototype.executeOnNoMatch}` is not provided, then a default handler is
   * used which concatenates the messages from all handlers which did not match the given arguments.
   *
   * @param definition The tool definition to register.
   * @param handler The handler to execute when the tool is invoked by an AI agent.
   * @param destroyRef Optional {@link DestroyRef} which will unregister the tool when triggered. When not provided,
   *     `inject(DestroyRef)` is used.
   * @returns A function that can be called to manually unregister the tool.
   */
  declareExclusiveToolHandler(
    definition: WebMcpExclusiveToolHandler,
    handler: WebMcpExclusiveHandler,
    destroyRef?: DestroyRef,
  ): () => void {
    return this.declareToolInternal(
      definition,
      handler,
      HandlerType.Exclusive,
      async (handlers, args) => {
        const failedMatches: string[] = [];
        for (const handler of handlers) {
          const match = await handler.match(args);
          if (match === true) {
            return handler.execute(args);
          } else {
            failedMatches.push(match);
          }
        }

        if (definition.executeOnNoMatch) {
          return definition.executeOnNoMatch(failedMatches, args);
        }

        // TODO: Should be an error, but agent seems to die on error?
        return {
          content: [
            {
              type: 'text',
              text: `
No tool handler matched the given arguments. This WebMCP tool is implemented by multiple handlers, but no handler
supported the given arguments. The handlers provided the following feedback about what they can support, consider
adjusting your arguments and trying again if one of these seems appropriate to you:

${failedMatches.map((m, index) => `${index + 1}. ${m}`).join('\n')}
      `.trim(),
            },
          ],
        };
      },
      destroyRef,
    );
  }

  private declareToolInternal<Handler extends WebMcpExclusiveHandler | WebMcpAggregatedHandler>(
    definition: WebMcpToolDefinition,
    handler: Handler,
    handlerType: HandlerType,
    execute: (
      handlers: Handler[],
      ...args: Parameters<WebMcpTool['execute']>
    ) => PromiseOr<WebMcpToolResult>,
    destroyRef: DestroyRef = inject(DestroyRef),
  ): () => void {
    if (!modelContext) {
      return () => {};
    }

    const existingData = this.definitionMap.get(definition);
    const data = existingData ?? {type: handlerType, handlers: [handler]};

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
      if (typeof ngDevMode === 'undefined' || ngDevMode) {
        if (handlerType !== existingData.type) {
          throw new Error(
            `All registrations of tool \`${definition.name}\` must be of the same type.`,
          );
        }
      }
      existingData.handlers.push(handler as any);
      return unregister;
    }

    this.definitionMap.set(definition, data as any);

    // First registration
    try {
      modelContext.registerTool({
        ...definition,
        // TODO: `AbortSignal` triggered when the tool is unregistered.
        execute: (args) => execute(data.handlers as Handler[], args),
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

// TODO: Concat in DOM order for components?
export const concatAggregator: WebMcpResultAggregator = (results) => {
  return {content: results.flatMap((r) => r.content)};
};
