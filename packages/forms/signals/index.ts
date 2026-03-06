/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Directive, input, WebMcpToolEvent} from '@angular/core';
import {FormField} from './public_api';

// This file is not used to build this module. It is only used during editing
// by the TypeScript language service and during build for verification. `ngc`
// replaces this file with production index.ts when it rewrites private symbol
// names.

export * from './public_api';

@Directive({
  selector: 'form[toolname]',
  host: {
    '(window:toolactivated)': 'onToolActivated($event)',
  },
})
export class FormTool {
  readonly toolName = input.required<string>({alias: 'toolname'});

  protected onToolActivated(event: WebMcpToolEvent) {
    if (event.toolName !== this.toolName()) return;

    for (const field of this.fields) {
      field.field()().markAsDirty();
    }
  }

  private readonly fields: FormField<unknown>[] = [];
  registerFormField(field: FormField<unknown>) {
    this.fields.push(field);
  }

  unregisterFormField(field: FormField<unknown>) {
    this.fields.splice(this.fields.indexOf(field), 1);
  }
}
