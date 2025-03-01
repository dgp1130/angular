/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

/// <reference types="chrome"/>

globalThis.devtoolsId ??= Math.floor(Math.random() * 1000);
declare global {
  var devtoolsId: number | undefined;
}
export {};

const frame = window.frameElement
  ? (window.frameElement.id ?? window.frameElement.getAttribute('src'))
  : 'top';
if (document.contentType === 'text/html') {
  console.info('[Angular DevTools] ng-validate injecting detect-angular script.', {
    frame,
    devtoolsId,
  }); // DEBUG
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('app/detect_angular_for_extension_icon_bundle.js');
  document.documentElement.appendChild(script);
  document.documentElement.removeChild(script);
  console.info('[Angular DevTools] ng-validate injected detect-angular script.', {
    frame,
    devtoolsId,
  }); // DEBUG
}
