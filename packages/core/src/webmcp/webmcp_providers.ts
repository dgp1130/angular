/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from '../di';
import {Type} from '../interface/type';
import {WebMcpRegistry} from './webmcp_registry';
import {WebMcpTool} from './webmcp_types';

/** TODO: This is not used yet. */
export interface WebMcpToolRepository {
  mcpTools: WebMcpTool[];
}

/**
 * Configure WebMCP Tools for the application.
 *
 * It will collect all implementations of `WebMcpTool` and eagerly register them
 * into the `WebMcpRegistry` when the application finishes bootstrapping.
 *
 * @param repositories A list of providers or types implementing `WebMcpTool` to be registered.
 */
export function provideWebMcp(repositories: Type<WebMcpToolRepository>[]): EnvironmentProviders {
  return makeEnvironmentProviders([
    repositories,
    provideEnvironmentInitializer(() => {
      const registry = inject(WebMcpRegistry);
      for (const repositoryType of repositories) {
        const repository = inject(repositoryType);
        for (const tool of repository.mcpTools) {
          registry.registerTool(tool);
        }
      }
    }),
  ]);
}
