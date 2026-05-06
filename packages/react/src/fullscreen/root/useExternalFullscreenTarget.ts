'use client';
import * as React from 'react';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { mergeCleanups } from '@base-ui/utils/mergeCleanups';
import { ownerDocument } from '@base-ui/utils/owner';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import {
  FULLSCREEN_CHANGE_EVENTS,
  FULLSCREEN_ERROR_EVENTS,
  isFullscreenEnabled,
} from './fullscreenApi';
import type { FullscreenStore } from '../store/FullscreenStore';

/**
 * The shape of the `target` prop on `<Fullscreen.Root>`.
 *
 * Accepts either a callback that returns the element (lazy, SSR-safe) or a
 * `React.RefObject` to the element. The element is resolved on every layout
 * effect so consumers can return a different element when their state changes.
 */
export type FullscreenTarget = (() => Element | null | undefined) | React.RefObject<Element | null>;

function resolveTarget(target: FullscreenTarget | undefined): Element | null {
  if (!target) {
    return null;
  }
  if (typeof target === 'function') {
    return target() ?? null;
  }
  return target.current ?? null;
}

/**
 * Wires an external `target` element to the `FullscreenStore`. Mirrors what
 * `<Fullscreen.Container>` does internally (populate the container ref, attach
 * document listeners, mark the API as supported), but for an arbitrary element
 * that is owned outside the `<Fullscreen.Root>` subtree.
 *
 * When `target` is `undefined`, this hook is a no-op so it can be called
 * unconditionally from `<Fullscreen.Root>`.
 */
export function useExternalFullscreenTarget(
  store: FullscreenStore,
  target: FullscreenTarget | undefined,
  handlers: {
    handleFullscreenChange: (event: Event) => void;
    handleFullscreenError: (event: Event) => void;
  },
) {
  const { handleFullscreenChange, handleFullscreenError } = handlers;

  useIsoLayoutEffect(() => {
    if (!target) {
      return undefined;
    }

    const element = resolveTarget(target);
    if (!element) {
      // No element resolved this commit (e.g. SSR, or the consumer's lazy
      // getter returned null). Mark the root as using an external target so a
      // sibling `<Fullscreen.Container>` still throws, and bail.
      store.set('hasExternalTarget', true);
      return () => {
        store.set('hasExternalTarget', false);
      };
    }

    const doc = ownerDocument(element);

    store.context.containerRef.current = element as HTMLElement;
    store.set('hasExternalTarget', true);
    store.set('supported', isFullscreenEnabled(doc));
    store.set('containerId', element.id !== '' ? element.id : undefined);

    const cleanups: Array<() => void> = [];
    for (const eventName of FULLSCREEN_CHANGE_EVENTS) {
      cleanups.push(addEventListener(doc, eventName, handleFullscreenChange));
    }
    for (const eventName of FULLSCREEN_ERROR_EVENTS) {
      cleanups.push(addEventListener(doc, eventName, handleFullscreenError));
    }
    const cleanup = mergeCleanups(...cleanups);

    return () => {
      cleanup();
      store.set('hasExternalTarget', false);
      store.set('containerId', undefined);
      if (store.context.containerRef.current === element) {
        store.context.containerRef.current = null;
      }
    };
  }, [target, store, handleFullscreenChange, handleFullscreenError]);
}
