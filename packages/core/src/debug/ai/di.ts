/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {getLContext} from '../../render3/context_discovery';
import {NodeInjector} from '../../render3/di';
import {TDirectiveHostNode, TNode} from '../../render3/interfaces/node';
import {INJECTOR, LView, TVIEW} from '../../render3/interfaces/view';
import {getInjectorResolutionPath} from '../../render3/util/injector_discovery_utils';
import {DiGraph, ElementSerializedInjector, SerializedInjector, serializeInjector} from './tree';
import {ToolDefinition} from './tool_definitions';
import {walkLViewChildren} from './traversal';

/**
 * Tool that exposes Angular's DI graph to AI agents.
 */
export const diGraphTool: ToolDefinition<unknown> = {
  name: 'angular:di_graph',
  description: 'Exposes the Angular Dependency Injection (DI) graph.',
  inputSchema: {
    type: 'object',
    properties: {},
  },
  execute: () => {
    const root = document.querySelector('[ng-version]');
    if (!root || !(root instanceof HTMLElement)) {
      throw new Error('Could not find Angular root element ([ng-version]) on the page.');
    }
    return discoverDiGraph(root);
  },
};

/**
 * Traverses the Angular internal tree from the root to discover element and environment injectors.
 */
function discoverDiGraph(root: HTMLElement): DiGraph {
  const context = getLContext(root);
  if (!context || !context.lView) {
    throw new Error('Provided root element is not an Angular managed element.');
  }

  const startLView = context.lView;
  const startTNode = startLView[TVIEW].data[context.nodeIndex!] as TNode;

  /**
   * Recursively discovers element injectors in the LView tree.
   */
  function* discoverElementInjectors(
    tNode: TNode,
    lView: LView,
  ): IterableIterator<SerializedInjector> {
    // Check if this node has its own discrete injector.
    const isDiscrete =
      tNode.injectorIndex !== -1 &&
      (!tNode.parent || tNode.injectorIndex !== tNode.parent.injectorIndex);

    if (isDiscrete) {
      const injector = new NodeInjector(tNode as TDirectiveHostNode, lView);
      const serialized = serializeInjector(injector) as ElementSerializedInjector;
      serialized.children = [];
      for (const [childTNode, childLView] of walkLViewChildren(tNode, lView)) {
        for (const childInjector of discoverElementInjectors(childTNode, childLView)) {
          serialized.children.push(childInjector);
        }
      }
      yield serialized;
    } else {
      for (const [childTNode, childLView] of walkLViewChildren(tNode, lView)) {
        yield* discoverElementInjectors(childTNode, childLView);
      }
    }
  }

  // 1. Discover the subtree's element injectors (as a tree).
  const elementInjectors = Array.from(discoverElementInjectors(startTNode, startLView));

  // 2. Discover environment injectors in the LView tree by listening for INJECTOR changes.
  function* discoverEnvironmentInjectors(
    tNode: TNode,
    lView: LView,
    lastEnv: any | null,
    parentEnvNode?: SerializedInjector,
  ): IterableIterator<SerializedInjector> {
    const currentEnv = lView[INJECTOR];
    let activeEnvNode = parentEnvNode;

    if (currentEnv !== lastEnv) {
      const serialized = serializeInjector(currentEnv);
      serialized.children = [];
      if (parentEnvNode) {
        (parentEnvNode.children as SerializedInjector[]).push(serialized);
      } else {
        yield serialized;
      }
      activeEnvNode = serialized;
    }

    for (const [childTNode, childLView] of walkLViewChildren(tNode, lView)) {
      yield* discoverEnvironmentInjectors(childTNode, childLView, currentEnv, activeEnvNode);
    }
  }

  const environmentChain = Array.from(discoverEnvironmentInjectors(startTNode, startLView, null));

  return {
    elementInjectors,
    environmentChain,
  };
}
