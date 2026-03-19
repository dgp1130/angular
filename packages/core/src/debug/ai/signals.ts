/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {getInjector} from '../../render3/util/discovery_utils';
import {getSignalGraph} from '../../render3/util/signal_debug';
import {Injector} from '../../di/injector';
import {ToolDefinition} from './tool_definitions';

/**
 * Tool that exposes Angular's signal dependency graph to AI agents.
 */
export const signalGraphTool: ToolDefinition<unknown> = {
  name: 'angular:signal_graph',
  description: 'Exposes the Angular signal dependency graph.',
  inputSchema: {
    type: 'object',
    properties: {
      target: {
        type: 'object',
        description: 'The element to get the signal graph for.',
        'x-mcp-type': 'HTMLElement',
      },
    },
    required: ['target'],
  },
  execute: (args: unknown) => {
    if (typeof args !== 'object' || args === null) {
      throw new Error('Invalid input: expected an object.');
    }
    const {target} = args as {target?: unknown};
    if (!(target instanceof HTMLElement)) {
      throw new Error('Invalid input: "target" must be an HTMLElement.');
    }

    const injector = getInjector(target);
    if (injector === Injector.NULL) {
      return {nodes: [], edges: []};
    }
    const graph = getSignalGraph(injector);
    return {
      // Filter out unneeded data.
      nodes: graph.nodes.map(({id, debuggableFn, ...node}) => node),
      edges: graph.edges,
    };
  },
};
