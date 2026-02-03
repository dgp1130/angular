import {ToolDefinition} from './tool_definitions';
import {getInjector} from '../util/discovery_utils';
import {getInjectorProviders} from '../util/injector_discovery_utils';
import {SerializedTree, Tree} from './tree';
import {InjectionToken, Injector} from '../../di';
import {Type} from '../../interface/type';

/** Provides a tool for inspecting Angular dependency injection state. */
export const diTool: ToolDefinition = {
  name: 'di-graph',
  description:
    'Provides the full dependency injection graph of the given Angular application root.',
  inputSchema: {
    type: 'object',
    properties: {
      'rootSelector': {type: 'string'},
    },
    required: ['rootSelector'],
  },
  execute: ({rootSelector}: {rootSelector: string}): SerializedTree[] => {
    // TODO: Would be great to just receive an `Element` reference directly.

    const root = document.querySelector(rootSelector);
    if (!root) throw new Error(`Root element not found: ${rootSelector}`);

    const providers = walkProviders(walkInjectors(walkDom(root)));
    return providers.flatMap((tree) => {
      return tree
        .map(({element, providers}) => ({
          tagName: element.tagName.toLowerCase(),
          providers: providers.map((provider) => getProviderName(provider.token)),
        }))
        .serialize(({tagName, providers}) => ({tagName, providers}));
    });
  },
};

/** Stores the analysis about a particular frame. */
export interface Analysis {
  /** Temporary test string. */
  providers: Array<SerializedTree>;
}

export interface ProviderMetadata {
  tagName: string;
  providers: string[];
}

interface ProviderRecord {
  token: Type<unknown> | InjectionToken<unknown>;
}

function walkDom(root: Element): Tree<Element> {
  return new Tree(
    root,
    Array.from(root.children, (child) => walkDom(child)),
  );
}

function walkInjectors(
  elements: Tree<Element>,
): Array<Tree<{element: Element; injector: Injector}>> {
  return elements.optionalMap((element) => {
    const injector = getInjector(element);
    if (!injector) return undefined;

    return {element, injector};
  });
}

function walkProviders(
  forest: Array<Tree<{element: Element; injector: Injector}>>,
): Array<Tree<{element: Element; providers: ProviderRecord[]}>> {
  return forest.flatMap((tree) => {
    return tree.optionalMap(({element, injector}) => {
      const providers = getInjectorProviders(injector);
      if (providers.length === 0) return undefined;
      return {element, providers};
    });
  });
}

function getProviderName(token: Type<unknown> | InjectionToken<unknown>): string {
  if (typeof token === 'function') {
    return token.name;
  } else {
    return token.toString();
  }
}
