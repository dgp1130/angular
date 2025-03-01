/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {initializeMessageBus} from 'ng-devtools-backend';

import {unHighlight} from '../../../ng-devtools-backend/src/lib/highlighter';

import {initializeExtendedWindowOperations} from './chrome-window-extensions';
import {SamePageMessageBus} from './same-page-message-bus';

const messageBus = new SamePageMessageBus(
  `angular-devtools-backend-${location.href}`,
  `angular-devtools-content-script-${location.href}`,
);

globalThis.devtoolsId ??= Math.floor(Math.random() * 1000);
declare global {
  var devtoolsId: number | undefined;
}
const frame = window.frameElement
  ? (window.frameElement.id ?? window.frameElement.getAttribute('src'))
  : 'top';
let initialized = false;
messageBus.on('handshake', () => {
  console.debug('[AngularDevTools] Backend received handshake.', {frame, devtoolsId}); // DEBUG
  if (initialized) {
    return;
  }
  initialized = true;
  initializeMessageBus(messageBus);
  initializeExtendedWindowOperations();

  let inspectorRunning = false;
  messageBus.on('inspectorStart', () => {
    inspectorRunning = true;
  });

  messageBus.on('inspectorEnd', () => {
    inspectorRunning = false;
  });

  // handles case when mouse leaves chrome extension too quickly. unHighlight() is not a very
  // expensive function and has an if check so it's DOM api call is not called more than necessary
  document.addEventListener(
    'mousemove',
    () => {
      if (!inspectorRunning) {
        unHighlight();
      }
    },
    false,
  );

  console.log('[Angular DevTools] Sending `backendReady` event.', {frame, devtoolsId}); // DEBUG
  messageBus.emit('backendReady');
});

console.log('[Angular DevTools] Backend installed.', {frame, devtoolsId}); // DEBUG
