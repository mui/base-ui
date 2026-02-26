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

export function getDelay(
  value: HoverDelay | (() => HoverDelay) | undefined,
  prop: 'open' | 'close',
  pointerType?: PointerEvent['pointerType'],
) {
  if (pointerType && !isMouseLikePointerType(pointerType)) {
    return 0;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'function') {
    const result = value();
    if (typeof result === 'number') {
      return result;
    }
    return result?.[prop];
  }

  return value?.[prop];
}

export function getCloseDelay(
  value: number | (() => number) | undefined,
  pointerType?: PointerEvent['pointerType'],
) {
  if (pointerType && !isMouseLikePointerType(pointerType)) {
    return 0;
  }

  if (typeof value === 'function') {
    return value();
  }

  return value;
}

export function getRestMs(value: number | (() => number)) {
  if (typeof value === 'function') {
    return value();
  }
  return value;
}
