import { isMouseLikePointerType } from '../utils';
import type { FloatingContext, FloatingTreeType } from '../types';

export interface HandleCloseOptions {
  buffer?: number | undefined;
  blockPointerEvents?: boolean | undefined;
  requireIntent?: boolean | undefined;
}

export interface HandleCloseContext extends FloatingContext {
  onClose: () => void;
  tree?: FloatingTreeType | null | undefined;
  leave?: boolean | undefined;
}

export interface HandleClose {
  (context: HandleCloseContext): (event: MouseEvent) => void;
  __options?: HandleCloseOptions | undefined;
}

type HoverDelay = number | Partial<{ open: number; close: number }>;

function shouldDisableHoverDelay(pointerType?: PointerEvent['pointerType']) {
  return pointerType != null && !isMouseLikePointerType(pointerType);
}

function resolveLazyValue<T>(value: T | (() => T) | undefined): T | undefined {
  if (typeof value === 'function') {
    return (value as () => T)();
  }

  return value;
}

export function getDelay(
  value: HoverDelay | (() => HoverDelay) | undefined,
  prop: 'open' | 'close',
  pointerType?: PointerEvent['pointerType'],
) {
  if (shouldDisableHoverDelay(pointerType)) {
    return 0;
  }

  const result = resolveLazyValue(value);
  if (typeof result === 'number') {
    return result;
  }

  return result?.[prop];
}

export function getCloseDelay(
  value: number | (() => number) | undefined,
  pointerType?: PointerEvent['pointerType'],
) {
  if (shouldDisableHoverDelay(pointerType)) {
    return 0;
  }

  return resolveLazyValue(value);
}

export function getRestMs(value: number | (() => number)) {
  if (typeof value === 'function') {
    return value();
  }
  return value;
}
