/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Injector} from '../../di/injector';
import {
  getInjectorMetadata,
  getInjectorProviders,
} from '../../render3/util/injector_discovery_utils';

/**
 * A serialized representation of an Angular dependency injection graph.
 */
export interface DiGraph {
  /** The tree of element injectors starting from the requested root element. */
  elementInjectors: SerializedInjector[];
  /** The linear resolution path of environment injectors that the element tree falls back to. */
  environmentChain: SerializedInjector[];
}

/**
 * A serialized representation of an Angular injector.
 */
export type SerializedInjector =
  | ElementSerializedInjector
  | EnvironmentSerializedInjector
  | NullSerializedInjector;

export interface ElementSerializedInjector {
  name: string;
  type: 'element';
  providers: SerializedProvider[];
  children: SerializedInjector[];
  /** The host element associated with this injector. */
  hostElement: HTMLElement;
}

export interface EnvironmentSerializedInjector {
  name: string;
  type: 'environment';
  providers: SerializedProvider[];
  children: SerializedInjector[];
}

export interface NullSerializedInjector {
  name: 'Null Injector';
  type: 'null';
  providers: [];
  children: [];
}

/**
 * A serialized representation of a DI provider.
 */
export interface SerializedProvider {
  tokenName: string;
  value: unknown;
}

/**
 * Gets a human-readable name for a DI token.
 */
export function getTokenName(token: any): string {
  if (typeof token === 'function') {
    return token.name || 'anonymous function';
  }
  try {
    return String(token);
  } catch {
    return '[Object]';
  }
}

/**
 * Serializes an injector and its children/providers into a tree.
 */
export function serializeInjector(injector: Injector): SerializedInjector {
  const metadata = getInjectorMetadata(injector);

  if (metadata?.type === 'null') {
    return {
      name: 'Null Injector',
      type: 'null',
      providers: [],
      children: [],
    };
  }

  // Only attempt to get providers for types supported by getInjectorProviders.
  const providers: SerializedProvider[] =
    metadata?.type === 'element' || metadata?.type === 'environment'
      ? getInjectorProviders(injector).map((record) => {
          return {
            tokenName: getTokenName(record.token),
            value: injector.get(record.token, null, {optional: true, self: true}),
          };
        })
      : [];

  if (metadata?.type === 'element') {
    return {
      name: injector.constructor.name,
      type: 'element',
      providers,
      children: [],
      hostElement: metadata.source as HTMLElement,
    };
  }

  return {
    name: (metadata?.source as string) ?? injector.constructor.name ?? 'Unknown Injector',
    type: 'environment', // Fallback for other injector types
    providers,
    children: [],
  };
}
