/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

export {ComputedNode, createComputed} from './src/computed';
export {ValueEqualityFn, defaultEquals} from './src/equality';
export {setThrowInvalidWriteToSignalError} from './src/errors';
export {
  REACTIVE_NODE,
  Reactive,
  ReactiveNode,
  SIGNAL,
  consumerAfterComputation,
  consumerBeforeComputation,
  consumerDestroy,
  consumerMarkDirty,
  consumerPollProducersForChange,
  getActiveConsumer,
  isInNotificationPhase,
  isReactive,
  producerAccessed,
  producerIncrementEpoch,
  producerNotifyConsumers,
  producerUpdateValueVersion,
  producerUpdatesAllowed,
  setActiveConsumer,
} from './src/graph';
export {
  Signal,
  SIGNAL_NODE,
  SignalGetter,
  SignalNode,
  createSignal,
  isSignal,
  runPostSignalSetFn,
  setPostSignalSetFn,
  signalSetFn,
  signalUpdateFn,
} from './src/signal';
export {Watch, WatchCleanupFn, WatchCleanupRegisterFn, createWatch} from './src/watch';
export {setAlternateWeakRefImpl} from './src/weak_ref';

import {formatter} from './src/formatter';

// Required as the signals library is in a separate package, so we need to explicitly ensure the
// global `ngDevMode` type is defined.
declare const ngDevMode: boolean | undefined;

if (typeof ngDevMode !== 'undefined' && ngDevMode) {
  (window as any).devtoolsFormatters ??= [];
  (window as any).devtoolsFormatters.push(formatter);
}
