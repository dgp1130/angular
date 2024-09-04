/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {SIGNAL} from './graph';
import {isSignal} from './signal';

/**
 * A custom formatter which renders signals in an easy-to-read format.
 *
 * @see https://firefox-source-docs.mozilla.org/devtools-user/custom_formatters/index.html
 */

export const formatter = {
  header(sig: any, config: any): any {
    // console.log(`formatting ${sig?.toString()} - ${isSignal(sig)}`); // DEBUG
    if (!isSignal(sig) || config?.skipFormatting) return null;

    const kind = 'computation' in sig[SIGNAL] ? 'Computed' : 'Signal';

    const value = sig();
    const isPrimitive = value === null || (!Array.isArray(value) && typeof value !== 'object');

    return [
      'span',
      {},
      ['span', {}, `${kind}(`],
      (() => {
        if (isSignal(value)) {
          // Recursively call formatter. Could return an `object` to call the formatter through DevTools,
          // but then recursive signals will render multiple expando arrows which is an awkward UX.
          return this.header(value, config);
        } else if (isPrimitive && value !== undefined && typeof value !== 'function') {
          // Use built-in rendering for primitives which applies standard syntax highlighting / theming.
          // Can't do this for `undefined` however, as the browser thinks we forgot to provide an object.
          // Also don't want to do this for functions which render nested expando arrows.
          return ['object', {object: value}];
        } else {
          return prettify(value as Record<string | number | symbol, unknown>);
        }
      })(),
      ['span', {}, `)`],
    ];
  },

  hasBody(sig: any, config: any) {
    return isSignal(sig) && !config?.skipFormatting;
  },

  body(sig: any, config: any) {
    // Render the "Value" with standard formatting followed by "Signal" so users
    // can still see all the accessible properties.
    return [
      'div',
      {},
      ['div', {}, ['span', {}, 'Value: '], ['object', {object: sig(), config}]],
      [
        'div',
        {},
        ['span', {}, 'Signal: '],
        ['object', {object: sig, config: {...config, skipFormatting: true}}],
      ],
    ];
  },
};

function prettify(value: Record<string | number | symbol, unknown> | Array<unknown> | undefined) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return `Array(${value.length})`;

  switch (typeof value) {
    case 'undefined': {
      return 'undefined';
    }
    case 'function': {
      if ('prototype' in value) {
        // This is what Chrome renders, can't use `object` though because it creates a nested expando arrow.
        return 'class';
      } else {
        return '() => {…}';
      }
    }
    case 'object': {
      if (value.constructor.name === 'Object') {
        return '{…}';
      } else {
        return `${value.constructor.name} {}`;
      }
    }
    default: {
      throw new Error(`Unknown type: ${typeof value}`);
    }
  }
}
