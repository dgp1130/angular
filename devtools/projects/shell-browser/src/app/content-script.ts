/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {ChromeMessageBus} from './chrome-message-bus';
import {SamePageMessageBus} from './same-page-message-bus';

let backgroundDisconnected = false;
let backendInstalled = false;
let backendInitialized = false;

const port = chrome.runtime.connect({
  name: `${document.title || location.href}`,
});

const handleDisconnect = (): void => {
  // console.log('Background disconnected', new Date());
  localMessageBus.emit('shutdown');
  localMessageBus.destroy();
  chromeMessageBus.destroy();
  backgroundDisconnected = true;
};

port.onDisconnect.addListener(handleDisconnect);

const detectAngularMessageBus = new SamePageMessageBus(
  `angular-devtools-content-script-${location.href}`,
  `angular-devtools-detect-angular-${location.href}`,
);

globalThis.devtoolsId ??= Math.floor(Math.random() * 1000);
declare global {
  var devtoolsId: number | undefined;
}
const frame = window.frameElement
  ? (window.frameElement.id ?? window.frameElement.getAttribute('src'))
  : 'top';
detectAngularMessageBus.on('detectAngular', (detectionResult) => {
  console.debug('[Angular DevTools] Received detect-angular event.', {
    frame,
    devtoolsId,
    backendInstalled,
    isAngular: detectionResult.isAngular,
  }); // DEBUG
  // only install backend once
  if (backendInstalled) {
    return;
  }

  if (detectionResult.isAngularDevTools !== true) {
    return;
  }

  if (detectionResult.isAngular !== true) {
    return;
  }

  // Defensive check against non html page. Realistically this should never happen.
  if (document.contentType !== 'text/html') {
    return;
  }

  console.log('[Angular DevTools] Content script injecting backend.', {frame, devtoolsId}); // DEBUG
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('app/backend_bundle.js');
  document.documentElement.appendChild(script);
  document.documentElement.removeChild(script);
  backendInstalled = true;
  console.log('[Angular DevTools] Content script injected backend.', {frame, devtoolsId}); // DEBUG
});

const localMessageBus = new SamePageMessageBus(
  `angular-devtools-content-script-${location.href}`,
  `angular-devtools-backend-${location.href}`,
);
const chromeMessageBus = new ChromeMessageBus(port);

const handshakeWithBackend = (): void => {
  console.debug('[Angular DevTools] Content script attempting handshake.', {frame, devtoolsId}); // DEBUG
  localMessageBus.emit('handshake');
};

chromeMessageBus.onAny((topic, args) => {
  localMessageBus.emit(topic, args);
});

localMessageBus.onAny((topic, args) => {
  console.debug('[Angular DevTools] Content script received backend ACK.', {frame, devtoolsId}); // DEBUG
  backendInitialized = true;
  chromeMessageBus.emit(topic, args);
});

if (!backendInitialized) {
  // tslint:disable-next-line:no-console
  console.log('Attempting initialization', new Date());

  const retry = () => {
    if (backendInitialized || backgroundDisconnected) {
      return;
    }
    handshakeWithBackend();
    setTimeout(retry, 500);
  };
  retry();
}

const proxyEventFromWindowToDevToolsExtension = (event: MessageEvent) => {
  if (event.data) {
    try {
      chrome.runtime.sendMessage(event.data);
    } catch (e) {
      const {message} = e as Error;
      if (message.includes('Extension context invalidated.')) {
        console.error(
          'Angular DevTools: Disconnecting content script due to invalid extension context. Please reload the page.',
        );
        window.removeEventListener('message', proxyEventFromWindowToDevToolsExtension);
      }
      throw e;
    }
  }
};

window.addEventListener('message', proxyEventFromWindowToDevToolsExtension);

console.log('[Angular DevTools] Content script installed.', {frame, devtoolsId}); // DEBUG
