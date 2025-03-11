/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {ContainerType, Descriptor, NestedProp, PropType} from 'protocol';

import {isSignal, unwrapSignal} from '../utils';

import {getKeys} from './object-utils';
import {getPropType} from './prop-type';
import {
  createLevelSerializedDescriptor,
  createNestedSerializedDescriptor,
  createShallowSerializedDescriptor,
  PropertyData,
} from './serialized-descriptor-factory';
import {DirectiveInstanceType} from '../interfaces';

// todo(aleksanderbodurri) pull this out of this file
const METADATA_PROPERTY_NAME = '__ngContext__';

const ignoreList = new Set([METADATA_PROPERTY_NAME, '__ngSimpleChanges__']);

const MAX_LEVEL = 1;

function nestedSerializer(
  instance: any,
  propName: string | number,
  nodes: NestedProp[],
  isReadonly: boolean,
  currentLevel = 0,
  level = MAX_LEVEL,
  isImmutableContextInput = false,
  isEditableInput = true,
): Descriptor {
  instance = unwrapSignal(instance);
  const serializableInstance = instance[propName];
  const propData: PropertyData = {
    prop: serializableInstance,
    type: getPropType(serializableInstance),
    containerType: getContainerType(serializableInstance),
  };

  const isEditable =
    isEditableInput && (!isImmutableContextInput || supportsImmutableUpdates(serializableInstance));
  const isImmutableContext = isImmutableContextInput || isSignal(serializableInstance);

  if (currentLevel < level) {
    const continuation = (
      instance: any,
      propName: string | number,
      isReadonly: boolean,
      nestedLevel?: number,
      _?: number,
    ) => {
      const nodeChildren = nodes.find((v) => v.name === propName)?.children ?? [];
      return nestedSerializer(
        instance,
        propName,
        nodeChildren,
        isReadonly,
        nestedLevel,
        level,
        isImmutableContext,
        isEditable,
      );
    };

    return levelSerializer(
      instance,
      propName,
      isReadonly,
      currentLevel,
      level,
      continuation,
      isImmutableContext,
      isEditable,
    );
  }

  switch (propData.type) {
    case PropType.Array:
    case PropType.Object:
      return createNestedSerializedDescriptor(
        instance,
        propName,
        propData,
        {level, currentLevel},
        nodes,
        nestedSerializer,
        isImmutableContext,
        isEditable,
      );
    default:
      return createShallowSerializedDescriptor(
        instance,
        propName,
        propData,
        isReadonly,
        isImmutableContext,
        isEditable,
      );
  }
}

function levelSerializer(
  instance: any,
  propName: string | number,
  isReadonly: boolean,
  currentLevel = 0,
  level = MAX_LEVEL,
  continuation = levelSerializer,
  isImmutableContextInput = false,
  isEditableInput = true,
): Descriptor {
  const serializableInstance = instance[propName];
  const propData: PropertyData = {
    prop: serializableInstance,
    type: getPropType(serializableInstance),
    containerType: getContainerType(serializableInstance),
  };

  const isImmutableContext = isImmutableContextInput || isSignal(serializableInstance);
  const isEditable =
    isEditableInput && (!isImmutableContext || supportsImmutableUpdates(serializableInstance));

  switch (propData.type) {
    case PropType.Array:
    case PropType.Object:
      return createLevelSerializedDescriptor(
        instance,
        propName,
        propData,
        {level, currentLevel},
        continuation,
        isImmutableContext,
        isEditable,
      );
    default:
      return createShallowSerializedDescriptor(
        instance,
        propName,
        propData,
        isReadonly,
        isImmutableContext,
        isEditable,
      );
  }
}

export function serializeDirectiveState(
  directive: DirectiveInstanceType,
  propPath?: string[],
): Record<string, Descriptor> {
  let data = directive.instance;
  let isImmutableContext = false;
  let isEditable = true;
  let signal = false;
  for (const prop of propPath ?? []) {
    data = data[prop];
    if (isSignal(data)) {
      data = data();
      signal = true;
      isImmutableContext = true;
    }
    isEditable = isEditable && (!isImmutableContext || supportsImmutableUpdates(data));

    if (!data) {
      console.error(`Cannot access properties \`${propPath}\` on \`${directive.name}\`.`);
    }
  }
  const result: Record<string, Descriptor> = {};
  getKeys(data).forEach((prop) => {
    if (typeof prop === 'string' && ignoreList.has(prop)) {
      return;
    }
    result[prop] = levelSerializer(
      data,
      prop,
      /* isReadonly */ signal,
      /* currentLevel */ 0,
      /* level */ 0,
      /* continuation */ undefined,
      isImmutableContext,
      isEditable,
    );
  });
  return result;
}

function supportsImmutableUpdates(instance: object): boolean {
  // Is plain `{}`.
  return (
    typeof instance === 'object' &&
    instance !== null &&
    Object.getPrototypeOf(instance) === Object.prototype
  );
}

export function deeplySerializeSelectedProperties(
  directive: object,
  props: NestedProp[],
): Record<string, Descriptor> {
  const result: Record<string, Descriptor> = {};
  const isReadonly = isSignal(directive);
  getKeys(directive).forEach((prop) => {
    if (ignoreList.has(prop)) {
      return;
    }
    const childrenProps = props.find((v) => v.name === prop)?.children;
    if (!childrenProps) {
      result[prop] = levelSerializer(
        directive,
        prop,
        isReadonly,
        /* currentLevel */ undefined,
        /* level */ undefined,
        /* continuation */ undefined,
        /* isImmutableContext */ false,
        /* isEditable */ true,
      );
    } else {
      result[prop] = nestedSerializer(
        directive,
        prop,
        childrenProps,
        isReadonly,
        /* currentLevel */ undefined,
        /* level */ undefined,
        /* isImmutableContext */ false,
        /* isEditable */ true,
      );
    }
  });
  return result;
}

function getContainerType(instance: unknown): ContainerType {
  if (isSignal(instance)) {
    return isWritableSignal(instance) ? 'WritableSignal' : 'ReadonlySignal';
  }

  return null;
}

function isWritableSignal(s: any): boolean {
  return typeof s['set'] === 'function';
}
