'use client';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { fastObjectShallowCompare } from '@base-ui/utils/fastObjectShallowCompare';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useCSPContext } from '../../internals/csp-context/CSPContext';
import type { CSPContextValue } from '../../internals/csp-context/CSPContext';
import { applyDraggableStaticSetup, bindDraggableSensors } from './draggable';
import type { DraggableConfig } from './draggable';
// Aliased to avoid shadowing the public `registerDraggable` method name.
import { registerDraggable as registerDraggableInRegistry } from './draggableRegistry';
import { registerAutoScroller, registerDropTarget, registerMonitor } from './registrations';
import { onceCleanup } from './utils';
import { cancelDrag } from './cancelDrag';
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
  RegisterDraggableParameters,
} from '../../types/dragRegistration';
import type { DragCleanupFn } from '../../types/drag';

import type { LatestGetter } from './useRegistrationRef';

/**
 * Draggable registration shared by `Draggable.Root` and the collection engine.
 * Kept separate from {@link DragEngineImpl} so declarative bundles exclude the full manager.
 */
export class DragEngineBase {
  constructor(
    private readonly getPreviewContext: LatestGetter<DragPreviewContext | null>,
    private readonly getCSPContext: LatestGetter<CSPContextValue>,
  ) {}

  // The nearest `Draggable.PreviewProvider`, or `null` when there is none.
  private get previewContext(): DragPreviewContext | null {
    return this.getPreviewContext();
  }

  registerDraggable = <TData = undefined>(
    element: HTMLElement,
    get: () => RegisterDraggableParameters<TData>,
    cacheParameters = false,
  ): DragCleanupFn => {
    const initial = get();

    // Always defined so every drag start clears any preview the previous drag left
    // behind. This also covers a drop and next pickup landing in one React flush.
    const onGenerateDragPreview: DraggableConfig<TData>['onGenerateDragPreview'] = (payload) => {
      // Read live at dispatch time, not captured at registration: nothing
      // re-registers a draggable when the nearest `Draggable.PreviewProvider`
      // re-renders, so a `container` that arrives after mount must still be seen by
      // the next drag.
      const previewContext = this.previewContext;
      // Clear any content the previous drag left in the shared overlay store.
      clearPublishedDragPreview();
      // Resolved by the sensor, which built the preview element from them
      // before starting the session this runs inside.
      const settings = getActiveDragPreviewSettings();
      // Only a host has React content to publish. Bail before
      // `getActivePreview()` below, which reports hosts alone — a clone would
      // read as "no preview" there and get torn straight back down.
      if (settings == null || settings.content !== 'host' || settings.disabled) {
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
    // preview wiring is overridden. Internal React-backed registrations opt into caching
    // while all inputs are unchanged: the lifecycle reads this getter on every
    // event, while those callers only replace `params` on a render.
    let lastParams: InternalDraggableParameters<TData> | null = null;
    // For the uncached (imperative) path: a shallow copy of the parameters the
    // current `normalized` was built from. Those getters may hand back one
    // mutated object every time, so identity says nothing — but a field-by-field
    // compare against the copy still tells an unchanged frame from a changed one,
    // and is far cheaper than rebuilding the ~20-field object on every dispatch.
    let lastParamsSnapshot: InternalDraggableParameters<TData> | null = null;
    let lastPreviewContainer: DraggableConfig<TData>['previewContainerDefault'];
    let lastCSPContext: CSPContextValue | null = null;
    let normalized: DraggableConfig<TData> | null = null;
    const getNormalized = (): DraggableConfig<TData> => {
      // `Draggable.Root` adds the preview-declaration channel to what it returns
      // here; the public parameter type hides it, since consumers never set it.
      const params = get() as InternalDraggableParameters<TData>;
      const previewContainerDefault = this.previewContext?.getContainer();
      const cspContext = this.getCSPContext();
      if (
        normalized !== null &&
        previewContainerDefault === lastPreviewContainer &&
        cspContext === lastCSPContext &&
        (cacheParameters
          ? params === lastParams
          : fastObjectShallowCompare(params, lastParamsSnapshot))
      ) {
        return normalized;
      }
      lastParams = params;
      lastParamsSnapshot = cacheParameters ? null : { ...params };
      lastPreviewContainer = previewContainerDefault;
      lastCSPContext = cspContext;
      normalized = {
        ...params,
        element,
        // A provider is a React concept the engine can't see, so its subtree default
        // has to be passed down. Read through the provider's stable ref, which keeps
        // the provider's context identity independent of `container`.
        previewContainerDefault,
        styleNonce: cspContext.nonce,
        disableStyleElements: cspContext.disableStyleElements,
        onGenerateDragPreview,
      } as DraggableConfig<TData>;
      return normalized;
    };

    // One-time static DOM setup, read once at registration.
    const restoreStatic = applyDraggableStaticSetup({
      element,
      dragHandle: initial.dragHandle,
      disabled: initial.disabled,
    });
    const unregister = registerDraggableInRegistry(element, getNormalized);
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
  registerDropTarget = registerDropTarget;

  registerAutoScroller = registerAutoScroller;

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
export function useRegisterDraggable(): DragEngineBase['registerDraggable'] {
  const previewContext = useDragPreviewContext();
  const cspContext = useCSPContext();
  const getPreviewContext = useStableCallback(() => previewContext);
  const getCSPContext = useStableCallback(() => cspContext);

  return useRefWithInit(() => new DragEngineBase(getPreviewContext, getCSPContext)).current
    .registerDraggable;
}

/**
 * Full engine hook used by `useDragDropManager`. Preview content resolves through
 * the provider nearest this hook call; registrations and sensors remain global.
 */
export function useInnerDragEngine(): InternalDragEngine {
  const previewContext = useDragPreviewContext();
  const cspContext = useCSPContext();
  const getPreviewContext = useStableCallback(() => previewContext);
  const getCSPContext = useStableCallback(() => cspContext);

  return useRefWithInit(() => new DragEngineImpl(getPreviewContext, getCSPContext)).current;
}
