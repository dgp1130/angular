/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {ApplicationRef} from '../application/application_ref';
import {
  EnvironmentProviders,
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from '../di';
import {Type} from '../interface/type';
import {WebMcpRegistry} from './webmcp_registry';
import {WebMcpTool, WebMcpToolEvent} from './webmcp_types';

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

      if (typeof window !== 'undefined') {
        // TODO: Do this through the framework?
        const updateFormFromToolCall = (evt: WebMcpToolEvent) => {
          const form = document.querySelector(`form[toolname="${evt.toolName}"]`);
          if (!form) {
            console.error(`Failed to find form for tool: ${evt.toolName}`);
            return;
          }

          for (const field of form.querySelectorAll('input, select, textarea')) {
            field.dispatchEvent(new CustomEvent('input'));
          }
        };

        window.addEventListener('toolactivated', updateFormFromToolCall);
        const appRef = inject(ApplicationRef);
        appRef.onDestroy(() => {
          window.removeEventListener('toolactivated', updateFormFromToolCall);
        });
      }
    }),
  ]);
}
