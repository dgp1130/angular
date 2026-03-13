/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {DestroyRef, Injector, untracked, type WritableSignal} from '@angular/core';
import {WebMcpRegistry, type WebMcpTool} from '@angular/core';
import {DYNAMIC} from '../schema/logic';
import {AbstractLogicNodeBuilder} from '../schema/logic_node';
import {
  MAX,
  MAX_LENGTH,
  MIN,
  MIN_LENGTH,
  OPTIONS,
  PARAMETER,
  ParameterOptions,
  PATTERN,
  REQUIRED,
} from '../api/rules/metadata';
import {type FieldTree} from '../api/types';
import {isArray, isObject} from '../util/type_guards';

/**
 * Registers a signal form as a WebMCP tool.
 *
 * @internal
 */
export function registerFormAsTool(
  injector: Injector,
  form: any,
  model: WritableSignal<any>,
  pathNode: any, // FieldPathNode
  name: string,
  description: string,
  allowAutoSubmit: boolean | undefined,
  submitFn: (form: any) => Promise<boolean>,
): void {
  const registry = injector.get(WebMcpRegistry);
  const destroyRef = injector.get(DestroyRef);

  const inputSchema = generateToolSchema(pathNode.builder, form);

  const tool: WebMcpTool = {
    name,
    description,
    inputSchema,
    execute: async (args) => {
      // 1. Populate the form with args.
      untracked(() => {
        model.set(args);
      });

      // 2. Submit the form.
      // We pass a mock event to capture the response if needed,
      // but submit() returns a promise of success.
      const success = await submitFn(form);

      return {
        content: [
          {
            type: 'text',
            text: success ? 'Success!' : 'Failed to submit form.',
          },
        ],
      };
    },
  };

  if (allowAutoSubmit) {
    tool.annotations = {...tool.annotations, allowAutoSubmit: 'true'};
  }

  registry.declareTool(tool, destroyRef);
}

function generateToolSchema(builder: AbstractLogicNodeBuilder, node: any): any {
  const schema: any = {
    type: 'object',
    properties: {},
    required: [],
  };

  // Get parameter metadata for this node.
  const paramOptions = untracked(() => node().metadata(PARAMETER)?.());

  if (paramOptions?.description) {
    schema.description = paramOptions.description;
  }
  if (paramOptions?.type) {
    if (paramOptions.type === 'email') {
      schema.type = 'string';
      schema.format = 'email';
      schema.description =
        (schema.description ? schema.description + ' ' : '') + '(Must be a valid email address)';
    } else {
      schema.type = paramOptions.type;
    }
  }

  // Handle other standard validation metadata.
  const min = untracked(() => node().metadata(MIN)?.());
  if (min !== undefined) {
    schema.minimum = min;
  }
  const max = untracked(() => node().metadata(MAX)?.());
  if (max !== undefined) {
    schema.maximum = max;
  }
  const minLength = untracked(() => node().metadata(MIN_LENGTH)?.());
  if (minLength !== undefined) {
    schema.minLength = minLength;
  }
  const maxLength = untracked(() => node().metadata(MAX_LENGTH)?.());
  if (maxLength !== undefined) {
    schema.maxLength = maxLength;
  }
  const patterns = untracked(() => node().metadata(PATTERN)?.());
  if (patterns && patterns.length > 0) {
    // JSON Schema only supports a single pattern string.
    schema.pattern = patterns[0].source;
  }

  // Get options metadata for this node.
  const options = untracked(() => node().metadata(OPTIONS)?.());
  if (options && options.length > 0) {
    schema.oneOf = options.map((opt: any) => ({
      const: opt.value,
      title: opt.label,
      description: opt.description,
    }));
  }

  const value = untracked(() => node().value());
  const builderKeys = builder.getChildKeys();

  if (builderKeys.includes(DYNAMIC) || isArray(value)) {
    // It's an array.
    schema.type = 'array';
    schema.items = generateToolSchema(builder.getChild(DYNAMIC), node[0] ?? node);
    // Object properties don't make sense if it's an array.
    delete schema.properties;
    delete schema.required;
  } else {
    // Collect all keys from both the builder (schema metadata) and the actual value (model data).
    const allKeys = new Set<string | symbol>(builderKeys as Array<string | symbol>);
    if (isObject(value)) {
      for (const key of Object.keys(value)) {
        allKeys.add(key);
      }
    }

    if (allKeys.size > 0) {
      for (const key of allKeys) {
        const childBuilder = builder.getChild(key);
        const childNode = node[key];
        const childSchema = generateToolSchema(childBuilder, childNode);
        const propName = String(key);

        // Check if required.
        const isRequired = untracked(() => childNode().metadata(REQUIRED)?.() ?? false);

        schema.properties[propName] = childSchema;
        if (isRequired) {
          schema.required.push(propName);
        }
      }
    } else {
      // No children, probably a leaf.
      if (!schema.type || schema.type === 'object') {
        // Infer type from value if possible.
        if (typeof value === 'number') {
          schema.type = 'number';
        } else if (typeof value === 'boolean') {
          schema.type = 'boolean';
        } else {
          schema.type = 'string';
        }
        delete schema.properties;
        delete schema.required;
      }
    }
  }

  // Final cleanup.
  if (schema.type === 'object') {
    if (schema.properties && Object.keys(schema.properties).length === 0) {
      delete schema.properties;
    }
    if (schema.required && schema.required.length === 0) {
      delete schema.required;
    }
  }

  return schema;
}
