import * as React from 'react';
import type { BaseUIEvent } from './types';
import { makeEventPreventable } from '../merge-props/mergeProps';
import { NOOP } from './noop';

/**
 * Creates a Base UI event from a React SyntheticEvent. The original event is mutated
 * to include `preventBaseUIHandler`/`baseUIHandlerPrevented`.
 */
export function createBaseUIEventFromSynthetic<E extends React.SyntheticEvent<Element, any>>(
  syntheticEvent: E,
): BaseUIEvent<E>;
export function createBaseUIEventFromSynthetic<
  E extends React.SyntheticEvent<Element, any>,
  Extra extends object,
>(syntheticEvent: E, extra: Extra): BaseUIEvent<E> & Extra;
export function createBaseUIEventFromSynthetic<
  E extends React.SyntheticEvent<Element, any>,
  Extra extends object = {},
>(syntheticEvent: E, extra?: Extra): BaseUIEvent<E> & Extra {
  const baseSynthetic = syntheticEvent as unknown as BaseUIEvent<E>;
  makeEventPreventable(baseSynthetic);
  if (extra) {
    Object.assign(baseSynthetic, extra);
  }
  return baseSynthetic as BaseUIEvent<E> & Extra;
}

/**
 * Creates a Base UI event from a native Event (or none). A lightweight SyntheticEvent-shaped
 * object is constructed so downstream code can always expect a consistent interface.
 */
export function createBaseUIEventFromNative<E extends Event = Event>(
  eventParam?: E,
): BaseUIEvent<React.SyntheticEvent<Element, E>>;
export function createBaseUIEventFromNative<E extends Event, Extra extends object>(
  eventParam: E | undefined,
  extra: Extra,
): BaseUIEvent<React.SyntheticEvent<Element, E>> & Extra;
export function createBaseUIEventFromNative<E extends Event, Extra extends object = {}>(
  eventParam?: E,
  extra?: Extra,
): BaseUIEvent<React.SyntheticEvent<Element, E>> & Extra {
  const nativeEvent = (eventParam ?? new Event('base-ui')) as E;

  const syntheticEvent: React.SyntheticEvent<Element, E> = {
    nativeEvent,
    bubbles: nativeEvent.bubbles,
    cancelable: nativeEvent.cancelable,
    currentTarget: nativeEvent.currentTarget as EventTarget & Element,
    defaultPrevented: nativeEvent.defaultPrevented,
    eventPhase: nativeEvent.eventPhase,
    isTrusted: nativeEvent.isTrusted,
    target: nativeEvent.target as EventTarget & Element,
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
  if (extra) {
    Object.assign(baseEvent, extra);
  }
  return baseEvent as BaseUIEvent<React.SyntheticEvent<Element, E>> & Extra;
}
