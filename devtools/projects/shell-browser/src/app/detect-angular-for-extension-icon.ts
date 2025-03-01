/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {AngularDetection} from 'protocol';
import {
  appIsAngular,
  appIsAngularInDevMode,
  appIsAngularIvy,
  appIsSupportedAngularVersion,
} from 'shared-utils';

import {SamePageMessageBus} from './same-page-message-bus';

const detectAngularMessageBus = new SamePageMessageBus(
  `angular-devtools-detect-angular-${location.href}`,
  `angular-devtools-content-script-${location.href}`,
);

globalThis.devtoolsId ??= Math.floor(Math.random() * 1000);
declare global {
  var devtoolsId: number | undefined;
}

function detectAngular(win: Window & typeof globalThis): void {
  const isAngular = appIsAngular();
  const isSupportedAngularVersion = appIsSupportedAngularVersion();
  const isDebugMode = appIsAngularInDevMode();
  const isIvy = appIsAngularIvy();

  const detection: AngularDetection = {
    isIvy,
    isAngular,
    isDebugMode,
    isSupportedAngularVersion,
    isAngularDevTools: true,
  };

  // For the background script to toggle the icon.
  win.postMessage(detection, '*');

  // For the content script to inject the backend.
  const frame = win.frameElement
    ? (win.frameElement.id ?? win.frameElement.getAttribute('src'))
    : 'top';
  console.debug('[Angular DevTools] detect-angular poll.', {frame, devtoolsId, isAngular}); // DEBUG
  detectAngularMessageBus.emit('detectAngular', [
    {
      isIvy,
      isAngular,
      isDebugMode,
      isSupportedAngularVersion,
      isAngularDevTools: true,
      frameName: window.frameElement?.id ?? 'top',
    } as any,
  ]);

  setTimeout(() => detectAngular(win), 1000);
}

const frame = window.frameElement
  ? (window.frameElement.id ?? window.frameElement.getAttribute('src'))
  : 'top';
console.log('[Angular DevTools] detect-angular installed.', {frame, devtoolsId}); // DEBUG
detectAngular(window);
