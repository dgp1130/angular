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
  InjectionToken,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from '../di';
import {Type} from '../interface/type';
import {WebMcpRegistry} from './webmcp_registry';
import {WebMcpTool} from './webmcp_types';

export interface WebMcpToolRepository {
  readonly mcpTools: WebMcpTool[];
}

/**
 * Configure WebMCP Tools for the application.
 *
 * It will collect all implementations of {@link WebMcpToolRepository} and eagerly register them into the
 * {@link WebMcpRegistry} when the application finishes bootstrapping.
 *
 * @param repositories A list of injection tokens implementing {@link WebMcpToolRepository} to be registered.
 */
export function provideWebMcp(
  repositories: Array<Type<WebMcpToolRepository> | InjectionToken<WebMcpToolRepository>>,
): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideEnvironmentInitializer(() => {
      const registry = inject(WebMcpRegistry);
      for (const repositoryToken of repositories) {
        const repository = inject(repositoryToken);
        for (const tool of repository.mcpTools) {
          registry.declareTool(tool);
        }
      }
    }),
  ]);
}
