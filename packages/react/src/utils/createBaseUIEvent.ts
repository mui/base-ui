import * as React from 'react';
import type { BaseUIEvent } from './types';
import { makeEventPreventable } from '../merge-props/mergeProps';
import { NOOP } from './noop';

/**
 * Creates a SyntheticEvent that satisfies the `BaseUIEvent` contract.
 */
export function createBaseUIEvent<E extends Event = Event>(
  eventParam?: React.SyntheticEvent<Element, E> | E,
): BaseUIEvent<React.SyntheticEvent<Element, E>> {
  if (eventParam && typeof eventParam === 'object' && 'persist' in eventParam) {
    const syntheticEvent = eventParam as React.SyntheticEvent<Element, E>;
    const baseSynthetic = syntheticEvent as unknown as BaseUIEvent<typeof syntheticEvent>;
    makeEventPreventable(baseSynthetic);
    return baseSynthetic;
  }

  const nativeEvent: E = (eventParam as E) ?? new Event('base-ui');

  const syntheticEvent: React.SyntheticEvent<Element, E> = {
    nativeEvent,
    bubbles: nativeEvent.bubbles,
    cancelable: nativeEvent.cancelable,
    currentTarget: nativeEvent.currentTarget as EventTarget & Element,
    defaultPrevented: nativeEvent.defaultPrevented,
    eventPhase: nativeEvent.eventPhase,
    isTrusted: nativeEvent.isTrusted,
    target: nativeEvent.target as EventTarget,
    timeStamp: nativeEvent.timeStamp,
    type: nativeEvent.type,
    preventDefault: nativeEvent.preventDefault,
    isDefaultPrevented: () => nativeEvent.defaultPrevented,
    stopPropagation: nativeEvent.stopPropagation,
    isPropagationStopped: () => false,
    persist: NOOP,
  };

  const baseEvent = syntheticEvent as unknown as BaseUIEvent<typeof syntheticEvent>;
  makeEventPreventable(baseEvent);

  return baseEvent as BaseUIEvent<React.SyntheticEvent<Element, E>>;
}
