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

    // Checked before any side effect. Only the returned cleanup releases the
    // static setup and the registry entry, so a later throw would leak a
    // half-registered element. The types require `kind`, so this only catches
    // plain JS or a cast, which would otherwise fail with a bare `TypeError`
    // deep in the engine.
    if (initial.kind == null) {
      throw new Error(
        'Base UI: registerSource() was called without a `kind`, so the drag source ' +
          'cannot be matched against any drop target or monitor `accept` and the ' +
          'registration cannot be completed. ' +
          'Create one with `Draggable.createKind` and pass it as `kind`. ' +
          'See https://base-ui.com/react/utils/draggable.',
      );
    }

    // Defined for every source, because whether a drag has React content to
    // publish is known only once the sensor resolves the preview at drag start.
    const publishPreview = (payload: DraggablePreviewRenderParameters<TPayload, TDragData>) => {
      // The sensor set up the preview before starting this session. Only custom
      // content needs React. The engine builds a clone without it, and attaches no
      // content to a disabled preview.
      const session = getActiveSession();
      const handle = session?.preview;
      const content = handle?.getContent();
      if (!session || !handle || !content) {
        return;
      }
      if (!content.render) {
        // The overlay renders whatever the store holds. Clear it with the session, so
        // a provider that unmounted mid-drag doesn't keep the content and its
        // detached host in memory until the next pickup.
        void session.onEnd(clearPublishedDragPreview);
      }
      content.render = publishPreview as (parameters: DraggablePreviewRenderParameters) => void;
      const node = content.renderContent(payload);
      // The render function is consumer code and may have ended the drag.
      if (getActiveSession()?.preview !== handle) {
        return;
      }
      // Content that resolves to nothing declines the preview. The engine then has
      // nothing to copy and shows no preview until a later render returns content.
      publishDragPreview(getPreviewContext(), {
        node: node === false ? null : node,
        container: content.container,
        sync: handle.syncContent,
      });
    };

    // The spread passes most parameters through, and only the preview and CSP
    // fields are overridden. The lifecycle reads this getter on every event, so
    // `normalized` is rebuilt only when its inputs change. The check compares
    // field by field against a shallow copy of the last parameters, not by
    // identity. An imperative getter may mutate and return the same object every
    // time, and only the copy can tell a changed call from an unchanged one. The
    // comparison still costs less than rebuilding the object's 20 or so fields.
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

    return registerDraggableElement(element, initial, getNormalized);
  };
}

/**
 * Returns the registration function `Draggable.Root` calls, bound to the nearest
 * `Draggable.Provider` and CSP context. It is stable across renders.
 *
 * It lives apart from `useManager`, which adds the stateless registrations, so the
 * auto-scroller stays out of every bundle that contains a `Draggable.Root`.
 */
export function useRegisterSource(): ReturnType<typeof createRegisterSource> {
  const previewContext = useDraggableContext();
  const cspContext = useCSPContext();
  const getPreviewContext = useStableCallback(() => previewContext);
  const getCSPContext = useStableCallback(() => cspContext);
  return useRefWithInit(() => createRegisterSource(getPreviewContext, getCSPContext)).current;
}
