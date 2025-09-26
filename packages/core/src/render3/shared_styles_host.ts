/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {InjectionToken} from '../di/injection_token';

/**
 * @publicApi
 */
export const SHARED_STYLES_HOST = new InjectionToken<SharedStylesHost>('SharedStylesHost');

/**
 * An interface for a shared styles host.
 * @publicApi
 */
export interface SharedStylesHost {
  addStyles(styles: string[], urls?: string[]): void;
  removeStyles(styles: string[], urls?: string[]): void;
  addHost(hostNode: Node): void;
  removeHost(hostNode: Node): void;
}
