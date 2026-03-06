/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Directive, ElementRef, inject, input} from '@angular/core';

import {submit} from '../api/structure';
import {FieldTree} from '../api/types';

/**
 * A directive that binds a `FieldTree` to a `<form>` element.
 *
 * It automatically:
 * 1. Sets `novalidate` on the form element to disable browser validation.
 * 2. Listens for the `submit` event, prevents the default behavior, and calls `submit()` on the
 * `FieldTree`.
 *
 * @usageNotes
 *
 * ```html
 * <form [formRoot]="myFieldTree">
 *   ...
 * </form>
 * ```
 *
 * @publicApi
 * @experimental 21.0.0
 */
@Directive({
  selector: 'form[formRoot]',
  host: {
    'novalidate': '',
    '(submit)': 'onSubmit($event)',
  },
})
export class FormRoot<T> {
  private readonly form = inject(ElementRef);
  readonly fieldTree = input.required<FieldTree<T>>({alias: 'formRoot'});

  protected onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    if (event.agentInvoked) {
      for (const field of this.form.nativeElement.querySelectorAll('input, select, textarea')) {
        field.dispatchEvent(new CustomEvent('input'));
      }
    }

    submit(this.fieldTree(), {event});
  }
}
