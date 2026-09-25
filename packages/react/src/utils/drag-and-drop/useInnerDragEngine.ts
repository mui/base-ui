'use client';

import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { fastObjectShallowCompare } from '@base-ui/utils/fastObjectShallowCompare';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useDraggableContext } from '../../draggable/DraggableContext';
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
import { clearPublishedDragPreview, publishDragPreview } from './overlay/dragPreviewStore';
import { useDragPreviewContext } from './overlay/DragPreviewContext';
import type { DragPreviewContext } from './overlay/DragPreviewContext';
import { throwMissingPreviewProvider } from './overlay/missingPreviewProvider';
import {
  getActiveDragPreviewSettings,
  getActivePreview,
  removeActivePreview,
} from './activePreview';
import { retargetEndingPreviewSource } from './synthetic/syntheticPreview';
import type {
  InternalDragEngine,
  InternalDraggableParameters,
  RegisterSourceParameters,
} from './registrationTypes';
import type { DragCleanupFn } from './types';

import type { LatestGetter } from './useRegistrationRef';

/**
 * Draggable registration shared by `Draggable.Root` and the imperative engine.
 * Kept separate from {@link DragEngineImpl} so declarative bundles exclude the full manager.
 */
export class DragEngineBase {
  constructor(
    private readonly getPreviewContext: LatestGetter<DragPreviewContext | null>,
    private readonly getCSPContext: LatestGetter<CSPContextValue>,
  ) {}

  registerSource = <TPayload = undefined, TDragData = unknown>(
    element: HTMLElement,
    get: () => RegisterSourceParameters<TPayload, TDragData>,
    payloadOwner?: object,
  ): DragCleanupFn => {
    const initial = get();

    // Checked before any side effect below: the static setup and the registry
    // entry are only released by the cleanup this method returns, so a throw
    // past them would leak a half-registered element. The types require `kind`;
    // reaching here means plain JS or a cast, where the failure would otherwise
    // be a bare `TypeError` deep in the engine.
    if (initial.kind == null) {
      throw new Error(
        'Base UI: registerSource() was called without a `kind`, so the drag source ' +
          'cannot be matched against any drop target or monitor `accept` and the ' +
          'registration cannot be completed. ' +
          'Create one with `Draggable.createKind` and pass it as `kind`. ' +
          'See https://base-ui.com/react/utils/draggable.',
      );
    }

    // Always defined so every drag start clears any preview the previous drag left
    // behind. This also covers a drop and next pickup landing in one React flush.
    const onGenerateDragPreview: DraggableConfig<TPayload, TDragData>['onGenerateDragPreview'] = (
      payload,
    ) => {
      // Resolve the current preview boundary when the drag starts. Always
      // present for the React parts and hooks, which throw without a
      // `Draggable.Provider`; `null` only when the engine is used by an
      // integration that never renders custom previews.
      const previewContext = this.getPreviewContext();
      // Clear any content the previous drag left in the shared overlay store.
      clearPublishedDragPreview();
      // Resolved by the sensor, which built the preview element from them
      // before starting the session this runs inside.
      const settings = getActiveDragPreviewSettings();
      // Only a host has React content to publish. Bail before
      // `getActivePreview()` below, which reports hosts alone — a clone would
      // read as "no preview" there and get torn straight back down.
      if (settings == null || settings.render === null || settings.disabled) {
        return;
      }
      // Authoritative: `useDeclaredPreview` throws earlier for a part, but an
      // imperative source's `render` only surfaces here, and either way the
      // params getter could have grown a `render` since registration.
      if (previewContext == null) {
        throwMissingPreviewProvider();
      }
      const preview = getActivePreview();
      const previewNode = preview ? settings.render(payload) : null;
      if (!isActive() || getActivePreview() !== preview) {
        return;
      }
      // Content that resolves to nothing declines the preview for this drag. Drop
      // the host the sensor built, or an empty box would follow the pointer.
      if (preview == null || previewNode == null || previewNode === false) {
        removeActivePreview();
        return;
      }
      publishDragPreview(previewContext, {
        node: previewNode,
        host: preview.element,
        offset: settings.offset,
        // Measured once by the engine, before the clone was inserted and the
        // source was marked — re-reading it here would force another reflow.
        sourceRect: preview.sourceRect,
        input: payload.location.initial.input,
      });
    };

    // Most parameters flow straight through the spread; only fields needing
    // preview wiring are overridden. The lifecycle reads this getter on every
    // event, so `normalized` is rebuilt only when its inputs changed. The compare
    // runs against a shallow copy of the parameters it was built from: React
    // callers hand back one object per render (which short-circuits on identity),
    // while an imperative getter may mutate and return the same object every
    // time, where only a field-by-field compare tells a changed frame from an
    // unchanged one — still far cheaper than rebuilding the ~20-field object.
    let lastParams: InternalDraggableParameters<TPayload, TDragData> | null = null;
    let lastCSPContext: CSPContextValue | null = null;
    let normalized: DraggableConfig<TPayload, TDragData> | null = null;
    const getNormalized = (): DraggableConfig<TPayload, TDragData> => {
      // `Draggable.Root` adds the preview-declaration channel to what it returns
      // here; the public parameter type hides it, since consumers never set it.
      const params = get() as InternalDraggableParameters<TPayload, TDragData>;
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

    // One-time static DOM setup, read once at registration.
    const restoreStatic = applyDraggableStaticSetup({
      element,
      handle: initial.handle,
      disabled: initial.disabled,
    });
    const unregister = addDraggableRegistration(element, getNormalized);
    retargetEndingPreviewSource(element, {
      kind: initial.kind.id,
      previewKey: initial.previewKey,
      payload: initial.payload,
    });
    const unbindSensors = bindDraggableSensors(element);

    return onceCleanup(() => {
      restoreStatic();
      unregister();
      unbindSensors();
    });
  };
}

export class DragEngineImpl extends DragEngineBase implements InternalDragEngine {
  cancelDrag = cancelDrag;

  // The stateless primitives, re-exposed as methods (see `./registrations`).
  registerTarget = registerTarget;

  registerViewport = registerViewport;

  registerMonitor = registerMonitor;
}

/**
 * The registration function `Draggable.Root` runs, bound to the current preview
 * provider and CSP context. Stable across renders.
 *
 * Returns the function rather than an object with one method on it: the caller
 * needs nothing else, and reaching for {@link useInnerDragEngine} here would pull
 * the drop-target and monitor registrations into every bundle containing a
 * `Draggable.Root`.
 */
export function useRegisterSource(): DragEngineBase['registerSource'] {
  return useDragEngineInstance(DragEngineBase).registerSource;
}

/** One engine instance per hook call, bound to the nearest preview provider and CSP context. */
function useDragEngineInstance<T extends DragEngineBase>(
  Engine: new (
    getPreviewContext: LatestGetter<DragPreviewContext | null>,
    getCSPContext: LatestGetter<CSPContextValue>,
  ) => T,
): T {
  useDraggableContext();
  const previewContext = useDragPreviewContext();
  const cspContext = useCSPContext();
  const getPreviewContext = useStableCallback(() => previewContext);
  const getCSPContext = useStableCallback(() => cspContext);

  return useRefWithInit(() => new Engine(getPreviewContext, getCSPContext)).current;
}

/**
 * Full engine hook used by `useManager`. Preview content resolves through
 * the provider nearest this hook call; registrations and sensors remain global.
 */
export function useInnerDragEngine(): InternalDragEngine {
  return useDragEngineInstance(DragEngineImpl);
}
