'use client';

import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { fastObjectShallowCompare } from '@base-ui/utils/fastObjectShallowCompare';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useDraggableContext } from '../../draggable/DraggableContext';
import type { DraggableContextValue } from '../../draggable/DraggableContext';
import { useCSPContext } from '../../internals/csp-context/CSPContext';
import type { CSPContextValue } from '../../internals/csp-context/CSPContext';
import { registerDraggableElement } from './draggable';
import type { DraggableConfig } from './draggable';
import { setParticipantOwner } from './participantData';
import { getActiveSession } from './core/dragSession';
import { clearPublishedDragPreview, publishDragPreview } from './overlay/dragPreviewStore';
import type { RegisterSourceParameters } from './registrationTypes';
import type { DragCleanupFn } from './types';
import type { DraggablePreviewRenderParameters } from '../../draggable/preview/DraggablePreview';

/**
 * Creates the draggable registration shared by `Draggable.Root` and the imperative
 * engine, bound to the given preview and CSP contexts.
 */
export function createRegisterSource(
  getPreviewContext: () => DraggableContextValue,
  getCSPContext: () => CSPContextValue,
) {
  return <TPayload = undefined, TDragData = unknown>(
    element: HTMLElement,
    get: () => RegisterSourceParameters<TPayload, TDragData>,
    payloadOwner?: object,
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

    // Defined for every source: whether a drag has React content to publish is
    // known only once the sensor resolves the preview at drag start.
    const publishPreview = (payload: DraggablePreviewRenderParameters<TPayload, TDragData>) => {
      // Only custom content needs React. A clone or a disabled preview has no content.
      const session = getActiveSession();
      const handle = session?.preview;
      const content = handle?.getContent();
      if (!session || !handle || !content) {
        return;
      }
      if (!content.render) {
        // Clear the store with the session, so a provider that unmounted mid-drag
        // doesn't keep the content and its detached host alive until the next pickup.
        void session.onEnd(clearPublishedDragPreview);
      }
      content.render = publishPreview as (parameters: DraggablePreviewRenderParameters) => void;
      const node = content.renderContent(payload);
      // The render function is consumer code and may have ended the drag.
      if (getActiveSession()?.preview !== handle) {
        return;
      }
      // Content that resolves to nothing shows no preview until a later render
      // returns some.
      publishDragPreview(getPreviewContext(), {
        node: node === false ? null : node,
        container: content.container,
        sync: handle.syncContent,
      });
    };

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
        onGenerateDragPreview: publishPreview,
      } as DraggableConfig<TPayload, TDragData>;
      return normalized;
    };

    if (payloadOwner) {
      setParticipantOwner(getNormalized, payloadOwner);
    }

    return registerDraggableElement(element, initial, getNormalized, payloadOwner);
  };
}

/**
 * The stable registration function `Draggable.Root` calls, bound to the nearest
 * `Draggable.Provider` and CSP context. Kept apart from `useManager` so the
 * auto-scroller stays out of every bundle that contains a `Draggable.Root`.
 */
export function useRegisterSource(): ReturnType<typeof createRegisterSource> {
  const previewContext = useDraggableContext();
  const cspContext = useCSPContext();
  const getPreviewContext = useStableCallback(() => previewContext);
  const getCSPContext = useStableCallback(() => cspContext);
  return useRefWithInit(() => createRegisterSource(getPreviewContext, getCSPContext)).current;
}
