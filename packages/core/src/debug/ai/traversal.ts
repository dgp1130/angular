/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {CONTAINER_HEADER_OFFSET} from '../../render3/interfaces/container';
import {TNode} from '../../render3/interfaces/node';
import {isLContainer, isLView} from '../../render3/interfaces/type_checks';
import {LView, TVIEW, T_HOST} from '../../render3/interfaces/view';

/**
 * A generator that yields the logical children of a given TNode in its LView.
 *
 * This includes:
 * 1. Direct child TNodes in the current view.
 * 2. The host node of a component's internal view.
 * 3. The host nodes of all embedded views in a container (*ngIf, *ngFor).
 *
 * @param tNode The parent TNode.
 * @param lView The current LView.
 * @returns A generator that yields [TNode, LView] pairs for each logical child.
 */
export function* walkLViewChildren(tNode: TNode, lView: LView): IterableIterator<[TNode, LView]> {
  // 1. Visit child TNodes in the current view.
  let child = tNode.child;
  while (child) {
    yield [child, lView];
    child = child.next;
  }

  // 2. If this is a component, visit its internal view.
  if (tNode.componentOffset > -1) {
    const componentLView = lView[tNode.index];
    if (isLView(componentLView)) {
      const componentTView = componentLView[TVIEW];
      // The host node of the component view is at index T_HOST of its TView.data.
      const componentTHost = componentTView.data[T_HOST] as TNode;
      if (componentTHost && componentTHost.child) {
        yield [componentTHost.child, componentLView];
      }
    }
  }

  // 3. If this is a container (like *ngIf), visit its embedded views.
  const slot = lView[tNode.index];
  if (isLContainer(slot)) {
    for (let i = CONTAINER_HEADER_OFFSET; i < slot.length; i++) {
      const embeddedLView = slot[i] as LView;
      const embeddedTView = embeddedLView[TVIEW];
      const embeddedTHost = embeddedTView.data[T_HOST] as TNode;
      if (embeddedTHost && embeddedTHost.child) {
        yield [embeddedTHost.child, embeddedLView];
      }
    }
  }
}
