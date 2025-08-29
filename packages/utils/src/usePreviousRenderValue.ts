'use client';
import { useRefWithInit } from './useRefWithInit';
import { useIsoLayoutEffect } from './useIsoLayoutEffect';

/**
 * Returns a value from the previous render.
 * @param value Current value.
 */
export function usePreviousRenderValue<T>(value: T): T | null {
  const previous = useRefWithInit(createPreviousRef, value).current;

  previous.next = value;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useIsoLayoutEffect(previous.effect);

  return previous.current;
}

function createPreviousRef<T>(value: T) {
  const previous = {
    current: null as T | null,
    next: value,
    effect: () => {
      previous.current = previous.next;
    },
  };

  return previous;
}
