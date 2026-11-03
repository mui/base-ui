'use client';

import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { fastObjectShallowCompare } from '@base-ui/utils/fastObjectShallowCompare';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useCSPContext } from '../../internals/csp-context/CSPContext';
import type { CSPContextValue } from '../../internals/csp-context/CSPContext';
import { registerDraggableElement } from './draggable';
import type { DraggableConfig } from './draggable';
import type { RegisterSourceParameters } from './registrationTypes';
import type { DragCleanupFn } from './types';
import type { RootDragStore } from './synthetic/syntheticPreview';

/**
 * Creates the draggable registration shared by `Draggable.Root` and the imperative
 * engine, bound to the given CSP context.
 */
export function createRegisterSource(getCSPContext: () => CSPContextValue) {
  return <TPayload = undefined, TDragData = unknown>(
    element: HTMLElement,
    get: () => RegisterSourceParameters<TPayload, TDragData>,
    owner?: RootDragStore,
  ): DragCleanupFn => {
    const initial = get();

    // Checked before any side effect: only the returned cleanup releases the setup,
    // so a later throw would leak a half-registered element. Catches plain JS or a
    // cast, which would otherwise hit a bare `TypeError` deep in the engine.
    if (initial.kind == null) {
      throw new Error(
        'Base UI: registerSource() was called without a `kind`, so the drag source ' +
          'cannot be matched against any drop target or monitor `accept` and the ' +
          'registration cannot be completed. ' +
          'Create one with `Draggable.createKind` and pass it as `kind`. ' +
          'See https://base-ui.com/react/utils/draggable.',
      );
    }

    // The lifecycle reads this getter on every event, so `normalized` is rebuilt only
    // when its inputs change. Compare against a shallow copy of the last parameters,
    // not by identity: an imperative getter may mutate and return the same object.
    let lastParams: RegisterSourceParameters<TPayload, TDragData> | null = null;
    let lastCSPContext: CSPContextValue | null = null;
    let normalized: DraggableConfig<TPayload, TDragData> | null = null;
    const getNormalized = (): DraggableConfig<TPayload, TDragData> => {
      const params = get();
      const cspContext = getCSPContext();
      if (
        normalized !== null &&
        cspContext === lastCSPContext &&
        fastObjectShallowCompare(params, lastParams)
      ) {
        return normalized;
      }
      lastParams = { ...params };
      lastCSPContext = cspContext;
      normalized = {
        ...params,
        styleNonce: cspContext.nonce,
        disableStyleElements: cspContext.disableStyleElements,
      } as DraggableConfig<TPayload, TDragData>;
      return normalized;
    };

    return registerDraggableElement(element, initial, getNormalized, owner);
  };
}

/**
 * The stable registration function `Draggable.Root` calls, bound to the nearest
 * CSP context. Kept apart from `useManager` so the
 * auto-scroller stays out of every bundle that contains a `Draggable.Root`.
 */
export function useRegisterSource(): ReturnType<typeof createRegisterSource> {
  const cspContext = useCSPContext();
  const getCSPContext = useStableCallback(() => cspContext);
  return useRefWithInit(() => createRegisterSource(getCSPContext)).current;
}
