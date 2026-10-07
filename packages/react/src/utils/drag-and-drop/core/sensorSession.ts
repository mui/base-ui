/**
 * Session bootstrap for the pointer sensor.
 *
 * It builds the preview from a draggable's parameters, takes the root lock, and
 * starts the lifecycle with a live getter for the draggable's handlers.
 */

import { ownerDocument } from '@base-ui/utils/owner';
import { start } from './lifecycleManager';
import type { DragSessionController } from './lifecycleManager';
import { getRegistration } from '../draggableRegistry';
import { getDropTargetShadowRootsByHost } from '../dropTarget';
import { elementFromPointIgnoring } from '../utils';
import { clearActivePreviewHandle, setActivePreviewHandle } from '../activePreview';
import { attachDragPreview, resolveDragPreview } from '../synthetic/pickupPreview';
import { compileDragModifiers } from '../dragModifiers';
import * as dragRootLock from '../synthetic/dragRootLock';
import {
  createSyntheticPreview,
  finishEndingPreview,
  getPreviewSourceIdentity,
} from '../synthetic/syntheticPreview';
import type { SyntheticPreviewHandle } from '../synthetic/syntheticPreview';
import type { DraggableConfig } from '../draggable';
import type { DraggableInput } from '../../../draggable/DraggableProvider';
import type { DraggableRootRecord } from '../../../draggable/root/DraggableRoot';
import type { DragStartReason } from '../types';

export interface CreatePreviewSessionParameters {
  /** The draggable's latest parameters (kind/payload/event handlers). */
  draggableParameters: DraggableConfig<any, any>;
  /** The source prepared for `onBeforeMoveStart`, carried unchanged into the session. */
  dragSource: DraggableRootRecord;
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
   * Where the user pressed. The grab offset anchors here, not at `initialInput`,
   * because the activation threshold puts the committed input a few pixels past
   * the press.
   */
  pressPoint: { x: number; y: number };
  /** Sensor-side force-cleanup, run from the lifecycle's teardown path. */
  onForceCleanup: () => void;
  /** Whether the sensor still owns the pickup after consumer callbacks. */
  isPickupCurrent: () => boolean;
}

/** The element under a client point, excluding the drag's own preview. */
export function hitTestUnderPreview(
  element: Element,
  preview: SyntheticPreviewHandle,
  clientX: number,
  clientY: number,
): Element | null {
  return elementFromPointIgnoring(
    ownerDocument(element),
    clientX,
    clientY,
    preview.getPreviewElement()?.element ?? null,
    getDropTargetShadowRootsByHost(),
  );
}

export interface PreviewSessionHandle {
  session: DragSessionController;
  preview: SyntheticPreviewHandle;
}

/**
 * Build the engine-managed preview for a pickup and start the lifecycle session.
 *
 * On success, returns the session and the preview it owns. When the pickup throws
 * or the lifecycle refuses to start (a drag is already running or the pickup was
 * canceled), everything acquired here is undone. The preview is destroyed, the
 * published handle is cleared and the root lock is released, so the sensor only
 * cleans up its own pre-pickup state. A throw is re-thrown after the undo.
 */
export function createPreviewAndStartSession(
  parameters: CreatePreviewSessionParameters,
): PreviewSessionHandle | null {
  const {
    draggableParameters,
    dragSource,
    initialInput,
    initialTarget,
    initialEvent,
    startReason,
    pressPoint,
    onForceCleanup,
    isPickupCurrent,
  } = parameters;
  const element = dragSource.element;

  let preview: SyntheticPreviewHandle | null = null;
  let locked = false;

  const undo = () => {
    if (preview) {
      clearActivePreviewHandle(preview);
      preview.destroy();
    }
    if (locked) {
      dragRootLock.unlock();
    }
  };

  try {
    // A source grabbed again while its previous clone is still settling carries
    // `data-dragging` and `data-settling`. Finish that clone first, so the source
    // is measured and cloned without the styles keyed on them.
    finishEndingPreview(element);
    // Measured before the preview is built and before `markSourceDragging()`
    // below. A `[data-dragging]` rule that resizes or hides the source would
    // otherwise corrupt the grab offset that anchors
    // `getSnappedLocalPoint({ anchor: 'source' })` for the whole drag.
    const pickupRect = element.getBoundingClientRect();
    const grabOffset = {
      x: pressPoint.x - pickupRect.left,
      y: pressPoint.y - pickupRect.top,
    };
    // The press as an input, so the preview's default `'source'` offset can anchor
    // on it. The preview measures its own untransformed box, so it cannot reuse
    // `grabOffset`, which is relative to the transformed rect above.
    const pressInput: DraggableInput = {
      ...initialInput,
      clientX: pressPoint.x,
      clientY: pressPoint.y,
    };

    const previewSettings = resolveDragPreview(draggableParameters, element);
    if (!isPickupCurrent()) {
      return null;
    }
    preview = createSyntheticPreview(
      element,
      getPreviewSourceIdentity(draggableParameters),
      compileDragModifiers(previewSettings.modifiers),
    );
    attachDragPreview(preview, element, previewSettings, initialInput, pressInput);
    // Only after the preview is built. A `[data-dragging]` rule that resizes or
    // hides the source would otherwise corrupt the measurement it was built from.
    preview.markSourceDragging();
    // Publish before the session starts. The lifecycle dispatches
    // `onGenerateDragPreview` synchronously from `start()`, and the React layer
    // reads the custom preview content from this slot while handling it.
    setActivePreviewHandle(preview);
    dragRootLock.lock(element);
    locked = true;
    // Place the preview at the current input so the first frame does not leave it
    // parked off-screen. The pickup event's modifier keys go with it, so a preview
    // modifier gated on a key applies from the first placement.
    preview.update(initialInput.clientX, initialInput.clientY, initialInput);

    if (!isPickupCurrent()) {
      undo();
      return null;
    }

    // Read the draggable's latest parameters on each dispatch, so a source that
    // re-renders mid-drag runs its current handlers. Falls back to the last
    // compatible snapshot if the element unregisters or changes kind mid-drag.
    // The kind is fixed for the session, and `dragSource` handles payload changes.
    //
    // Read `dragSource.element`, not the start-time `element`. A virtualizer can
    // remount the source to a new node mid-drag, which registers the new element
    // and re-points `dragSource.element` at it (see `retargetDragSource`). The old
    // element's registration is gone, so only the live node resolves the current
    // handlers.
    let latest: DraggableConfig<any, any> = draggableParameters;
    const getLatestParameters = (): DraggableConfig<any, any> => {
      const current = getRegistration(dragSource.element)?.();
      if (current !== undefined && current.kind.id === dragSource.kind) {
        latest = current;
      }
      return latest;
    };

    const sessionPreview = preview;
    const session = start({
      source: dragSource,
      getSourceHandlers: getLatestParameters,
      initialInput,
      initialTarget,
      initialEvent,
      startReason,
      grabOffset,
      hitTest: (clientX, clientY) => hitTestUnderPreview(element, sessionPreview, clientX, clientY),
      onForceCleanup,
      onRelease: (dropped) => {
        if (dropped) {
          sessionPreview.markDropped();
        }
      },
    });
    if (!session) {
      // The lifecycle refused (a drag is already running or pickup was canceled).
      undo();
      return null;
    }
    return { session, preview: sessionPreview };
  } catch (error) {
    undo();
    throw error;
  }
}
