/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {LogicFn, PathKind, SchemaPath, SchemaPathRules} from '../../types';
import {metadata, OPTIONS, Option, OptionWithMetadata} from '../metadata';
import {BaseValidatorConfig, getOption} from './util';
import {validate} from './validate';
import {oneOfError} from './validation_errors';

/**
 * Options for the {@link oneOf} rule.
 *
 * @experimental 21.1.0
 */
export type OneOfConfig<TValue, TPathKind extends PathKind> = BaseValidatorConfig<
  TValue,
  TPathKind
>;

/**
 * Binds a validator to the given path that requires the value to be one of the provided options.
 * In addition to binding a validator, this function adds `OPTIONS` property to the field.
 *
 * @param path Path of the field to validate
 * @param options The set of allowed values or options with metadata.
 * @param config Optional, allows providing any of the following options:
 *  - `message`: A user-facing message for the error.
 *  - `error`: Custom validation error(s) to be used instead of the default `ValidationError.oneOf()`
 *    or a function that receives the `FieldContext` and returns custom validation error(s).
 * @template TValue The type of value stored in the field the logic is bound to.
 * @template TPathKind The kind of path the logic is bound to (a root path, child path, or item of an array)
 *
 * @category validation
 * @experimental 21.1.0
 */
export function oneOf<TValue, TPathKind extends PathKind = PathKind.Root>(
  path: SchemaPath<TValue, SchemaPathRules.Supported, TPathKind>,
  options: readonly (TValue | Option<TValue>)[],
  config?: OneOfConfig<TValue, TPathKind>,
): void {
  const normalizedOptions: OptionWithMetadata<TValue>[] = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null && 'value' in opt) {
      const o = opt as Option<TValue>;
      return {
        value: o.value,
        label: o.label ?? String(o.value),
        description: o.description,
      };
    }
    return {
      value: opt as TValue,
      label: String(opt),
    };
  });

  metadata(path, OPTIONS, () => normalizedOptions);

  validate(path, (ctx) => {
    const value = ctx.value();
    if (value === null || value === undefined) {
      return undefined;
    }

    const isValid = normalizedOptions.some((opt) => opt.value === value);
    if (!isValid) {
      if (config?.error) {
        return getOption(config.error as any, ctx);
      } else {
        return oneOfError({message: getOption(config?.message as any, ctx)});
      }
    }
    return undefined;
  });
}
