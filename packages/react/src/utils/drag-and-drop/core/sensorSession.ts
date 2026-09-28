/**
 * Session bootstrap for the pointer sensor.
 *
 * It builds the preview, drag payload, and source-handler map from a draggable's
 * parameters and hands them to the lifecycle.
 */

import { start } from './lifecycleManager';
import type { DragSessionController } from './lifecycleManager';
import { getRegistration } from '../draggableRegistry';
import { setActivePreviewHandle } from '../activePreview';
import { resolveDragPreview } from '../synthetic/dragPreviewSettings';
import { compileDragModifiers } from '../dragModifiers';
import { attachDefaultDragPreview } from '../synthetic/defaultDragPreview';
import { createSyntheticPreview } from '../synthetic/syntheticPreview';
import type { SyntheticPreviewHandle } from '../synthetic/syntheticPreview';
import type { DraggableConfig } from '../draggable';
import type { DraggableInput } from '../../../draggable/DraggableProvider';
import type { DraggableRootRecord } from '../../../draggable/root/DraggableRoot';
import type { DragStartReason } from '../types';

export interface CreatePreviewSessionParameters {
  /** The draggable's latest parameters (kind/payload/event handlers). */
  draggableParameters: DraggableConfig<any, any>;
  /** Source prepared for onBeforeMoveStart, carried unchanged into the session. */
  dragSource: DraggableRootRecord;
  element: HTMLElement;
  initialInput: DraggableInput;
  initialTarget: Element | null;
  /**
   * The native event the pickup committed on (see `StartParameters.initialEvent`),
   * so `onMoveStart` reports a real event rather than a placeholder.
   */
  initialEvent?: Event | undefined;
  /** Why the pickup started (see `StartParameters.startReason`). */
  startReason: DragStartReason;
  /**
   * Where the user pressed. The grab offset anchors here rather than at
   * `initialInput`: the activation threshold puts the committed input a few
   * pixels past the press, and the point the user took hold of is the press.
   */
  pressPoint: { x: number; y: number };
  /** Sensor-side force-cleanup, run from the lifecycle's teardown path. */
  onForceCleanup: () => void;
  /** Whether the sensor still owns the pickup after consumer callbacks. */
  isPickupCurrent: () => boolean;
  /**
   * Acquire a sensor-specific resource once the preview handle is published
   * (the pointer sensor's root scroll lock).
   */
  acquire: () => void;
  /** Undo `acquire` when the pickup throws or the lifecycle refuses. */
  release: () => void;
}

export interface PreviewSessionHandle {
  session: DragSessionController;
  preview: SyntheticPreviewHandle;
}

/**
 * Build the engine-managed preview for a pickup and start the lifecycle session.
 *
 * On success returns the session and the preview it owns. When the pickup
 * throws or the lifecycle refuses to start (a drag is already running or pickup was canceled), every
 * resource acquired here is undone — the preview is destroyed, the published
 * handle slot is restored, `release` runs — and the sensor only has its own
 * pre-pickup state left to clean up. A throw is re-thrown after the undo.
 */
export function createPreviewAndStartSession(
  parameters: CreatePreviewSessionParameters,
): PreviewSessionHandle | null {
  const {
    draggableParameters,
    dragSource,
    element,
    initialInput,
    initialTarget,
    initialEvent,
    startReason,
    pressPoint,
    onForceCleanup,
    isPickupCurrent,
    acquire,
    release,
  } = parameters;

  let preview: SyntheticPreviewHandle | null = null;
  let restoreActivePreviewSlot: (() => void) | null = null;
  let acquired = false;
  let session: DragSessionController | null = null;

  const undo = () => {
    restoreActivePreviewSlot?.();
    preview?.destroy();
    if (acquired) {
      release();
    }
  };

  try {
    // Measured before the preview is built and before `markSourceDragging()`
    // below, for the same reason the preview measures first: a `[data-dragging]`
    // rule that resizes or hides the source would corrupt the grab offset that
    // anchors `getSnappedLocalPoint({ anchor: 'source' })` for the whole drag.
    const pickupRect = element.getBoundingClientRect();
    const grabOffset = {
      x: pressPoint.x - pickupRect.left,
      y: pressPoint.y - pickupRect.top,
    };
    // The press, carried as an input so the preview's default `'source'` offset can
    // anchor on it: the preview measures its own (untransformed) box, so it must not
    // reuse `grabOffset`, which is relative to the transformed rect above.
    const pressInput: DraggableInput = {
      ...initialInput,
      clientX: pressPoint.x,
      clientY: pressPoint.y,
    };

    const previewSettings = resolveDragPreview(draggableParameters, element);
    if (!isPickupCurrent()) {
      return null;
    }
    preview = createSyntheticPreview(element, {
      kind: draggableParameters.kind.id,
      previewKey: draggableParameters.previewKey,
      payload: draggableParameters.payload,
    });
    preview.setModifiers(compileDragModifiers(previewSettings.modifiers));
    attachDefaultDragPreview(preview, element, previewSettings, initialInput, pressInput);
    // Only now: a `[data-dragging]` rule that resizes or hides the source would
    // otherwise corrupt the measurement the preview was just built from.
    preview.markSourceDragging();
    // Publish before the session starts: the lifecycle dispatches
    // `onGenerateDragPreview` synchronously from `start()`, and the
    // React layer resolves the preview host from this slot while handling it.
    restoreActivePreviewSlot = setActivePreviewHandle(preview, previewSettings);
    acquire();
    acquired = true;
    // Seed the preview to the current input position so the first frame
    // isn't placed at (−10000, −10000) visibly. The pickup event's keys go with it, so a
    // preview modifier gated on one is honored from the very first placement.
    preview.update(initialInput.clientX, initialInput.clientY, initialInput);

    if (!isPickupCurrent()) {
      undo();
      return null;
    }

    // Read the draggable's latest parameters live on each dispatch so a source that
    // re-renders mid-drag runs its current handler closures. Falls back to the
    // last compatible snapshot if the element unregisters or changes kind mid-drag.
    // The kind stays fixed for the session; payload changes are handled by `dragSource`.
    //
    // Read `dragSource.element` rather than the start-time `element`: a virtualizer
    // can remount the source to a fresh node mid-drag, which re-registers under
    // the new element and re-points `dragSource.element` at it (see
    // `retargetDragSource`). The old element's registration is gone, so
    // resolving against the live node keeps the fresh handler closures flowing.
    //
    // The snapshot is copied only when the getter hands back a new object. The
    // registration layer already returns one object until its inputs change, and
    // this runs on every dispatch, so copying per call would rebuild the ~20-field
    // object each frame for nothing.
    let lastCompatible: DraggableConfig<any, any> = draggableParameters;
    let compatibleParameters = { ...draggableParameters };
    const getLatestParameters = (): DraggableConfig<any, any> => {
      const current = getRegistration(dragSource.element)?.();
      if (
        current !== undefined &&
        current !== lastCompatible &&
        current.kind.id === dragSource.kind
      ) {
        lastCompatible = current;
        compatibleParameters = { ...current };
      }
      return compatibleParameters;
    };

    const sessionPreview = preview;
    session = start({
      payload: dragSource,
      getSourceHandlers: getLatestParameters,
      initialInput,
      initialTarget,
      initialEvent,
      startReason,
      grabOffset,
      synthetic: {
        getPreviewElement: () => sessionPreview.getPreviewElement()?.element ?? null,
      },
      onForceCleanup,
    });
  } catch (error) {
    undo();
    throw error;
  }

  if (!session) {
    // The lifecycle refused (a drag is already running or pickup was canceled). Restore whatever the slot
    // held before this pickup published — the refusing drag is still in progress
    // and its handle must keep flowing.
    undo();
    return null;
  }

  return { session, preview: preview! };
}
