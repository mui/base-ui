'use client';

import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { fastObjectShallowCompare } from '@base-ui/utils/fastObjectShallowCompare';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useDraggableContext } from '../../draggable/DraggableContext';
import type { DraggableContextValue } from '../../draggable/DraggableContext';
import { useCSPContext } from '../../internals/csp-context/CSPContext';
import type { CSPContextValue } from '../../internals/csp-context/CSPContext';
import { applyDraggableStaticSetup, bindDraggableSensors } from './draggable';
import type { DraggableConfig } from './draggable';
import { addDraggableRegistration } from './draggableRegistry';
import { registerViewport, registerTarget, registerMonitor } from './registrations';
import { onceCleanup } from './utils';
import { setParticipantOwner } from './participantData';
import { cancelDrag } from './cancelDrag';
import { isActive } from './core/lifecycleManager';
import { publishDragPreview } from './overlay/dragPreviewStore';
import { getActiveDragPreviewSettings, getActivePreviewHandle } from './activePreview';
import { retargetEndingPreviewSource } from './synthetic/syntheticPreview';
import type { InternalDragEngine, InternalDraggableParameters } from './registrationTypes';
import type { DragCleanupFn } from './types';

/**
 * Draggable registration shared by `Draggable.Root` and the imperative engine.
 * Kept separate from {@link DragEngineImpl} so declarative bundles exclude the full manager.
 */
export class DragEngineBase {
  constructor(
    private readonly getPreviewContext: () => DraggableContextValue,
    private readonly getCSPContext: () => CSPContextValue,
  ) {}

  registerSource = <TPayload = undefined, TDragData = unknown>(
    element: HTMLElement,
    get: () => InternalDraggableParameters<TPayload, TDragData>,
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
    const onGenerateDragPreview: DraggableConfig<TPayload, TDragData>['onGenerateDragPreview'] = (
      payload,
    ) => {
      // The sensor resolved these settings and built the preview element from
      // them before starting this session.
      const settings = getActiveDragPreviewSettings();
      // Only a host preview has React content to publish. The engine builds and
      // manages a clone preview without React.
      if (settings == null || settings.render === null || settings.disabled) {
        return;
      }
      const preview = getActivePreviewHandle()?.getPreviewElement() ?? null;
      const previewNode = preview ? settings.render(payload) : null;
      const handle = getActivePreviewHandle();
      if (!isActive() || (handle?.getPreviewElement() ?? null) !== preview) {
        return;
      }
      // Content that resolves to nothing declines the preview for this drag. Drop
      // the host the sensor built, or an empty box would follow the pointer.
      if (preview == null || previewNode == null || previewNode === false) {
        handle?.removePreviewElement();
        return;
      }
      publishDragPreview(this.getPreviewContext(), {
        node: previewNode,
        host: preview.element,
        offset: settings.offset,
        // The engine measured it before inserting the clone and marking the
        // source. Measuring again here would force another reflow.
        sourceRect: preview.sourceRect,
        input: payload.location.initial.input,
      });
    };

    // The spread passes most parameters through, and only the preview and CSP
    // fields are overridden. The lifecycle reads this getter on every event, so
    // `normalized` is rebuilt only when its inputs change. The check compares
    // field by field against a shallow copy of the last parameters, not by
    // identity. An imperative getter may mutate and return the same object every
    // time, and only the copy can tell a changed call from an unchanged one. The
    // comparison still costs less than rebuilding the object's 20 or so fields.
    let lastParams: InternalDraggableParameters<TPayload, TDragData> | null = null;
    let lastCSPContext: CSPContextValue | null = null;
    let normalized: DraggableConfig<TPayload, TDragData> | null = null;
    const getNormalized = (): DraggableConfig<TPayload, TDragData> => {
      const params = get();
      const cspContext = this.getCSPContext();
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
        element,
        styleNonce: cspContext.nonce,
        disableStyleElements: cspContext.disableStyleElements,
        onGenerateDragPreview,
      } as DraggableConfig<TPayload, TDragData>;
      return normalized;
    };

    if (payloadOwner) {
      setParticipantOwner(getNormalized, payloadOwner);
    }

    // Static DOM setup, read at registration. The pointer sensor bound below
    // refreshes it from the live registration on each press.
    const staticSetup = applyDraggableStaticSetup({
      element,
      handle: initial.handle,
      disabled: initial.disabled,
    });
    const unregister = addDraggableRegistration(element, getNormalized, staticSetup.refresh);
    retargetEndingPreviewSource(element, {
      kind: initial.kind.id,
      previewKey: initial.previewKey,
      payload: initial.payload,
    });
    const unbindSensors = bindDraggableSensors(element);

    return onceCleanup(() => {
      staticSetup.release();
      unregister();
      unbindSensors();
    });
  };
}

class DragEngineImpl extends DragEngineBase implements InternalDragEngine {
  cancelDrag = cancelDrag;

  // The stateless primitives, re-exposed as methods (see `./registrations`).
  registerTarget = registerTarget;

  registerViewport = registerViewport;

  registerMonitor = registerMonitor;
}

/**
 * Returns the registration function `Draggable.Root` calls, bound to the nearest
 * `Draggable.Provider` and CSP context. It is stable across renders.
 *
 * It returns only this function because {@link useInnerDragEngine} would pull the
 * drop-target and monitor registrations into every bundle that contains a
 * `Draggable.Root`.
 */
export function useRegisterSource(): DragEngineBase['registerSource'] {
  return useDragEngineInstance(DragEngineBase).registerSource;
}

/** One engine instance per hook call, bound to the nearest `Draggable.Provider` and CSP context. */
function useDragEngineInstance<T extends DragEngineBase>(
  Engine: new (
    getPreviewContext: () => DraggableContextValue,
    getCSPContext: () => CSPContextValue,
  ) => T,
): T {
  const previewContext = useDraggableContext();
  const cspContext = useCSPContext();
  const getPreviewContext = useStableCallback(() => previewContext);
  const getCSPContext = useStableCallback(() => cspContext);

  return useRefWithInit(() => new Engine(getPreviewContext, getCSPContext)).current;
}

/**
 * Returns the full engine, for `useManager`. Preview content renders through the
 * `Draggable.Provider` nearest this hook call. Registrations and sensors are global.
 */
export function useInnerDragEngine(): InternalDragEngine {
  return useDragEngineInstance(DragEngineImpl);
}
