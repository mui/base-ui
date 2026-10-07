/**
 * The pickup: build the drag preview, take the root lock, and start the lifecycle
 * session. The pointer sensor runs it when a gesture activates, and the session
 * releases what it acquires (see `sensor.release`).
 */

import type * as React from 'react';
import { ownerDocument } from '@base-ui/utils/owner';
import * as dragRootLock from './dragRootLock';
import {
  createDragPreview,
  finishEndingPreview,
  getPreviewSourceIdentity,
} from './syntheticPreview';
import type { DragPreview } from './syntheticPreview';
import { start } from '../core/lifecycleManager';
import type { DragSessionController, DragSessionSensor } from '../core/lifecycleManager';
import { getRegistration } from '../draggableRegistry';
import { getDropTargetShadowRootsByHost } from '../dropTarget';
import type { DraggableConfig } from '../draggable';
import { elementFromPointIgnoring, resolveElementReference } from '../utils';
import type { DragStartReason } from '../types';
import type { DraggableInput } from '../../../draggable/DraggableProvider';
import type {
  DraggablePreviewOffset,
  DraggablePreviewRenderParameters,
} from '../../../draggable/preview/DraggablePreview';
import type {
  DraggableRootModifiers,
  DraggableRootRecord,
} from '../../../draggable/root/DraggableRoot';

/**
 * The preview settings for one drag, resolved from the registration's `preview`,
 * which a `Draggable.Preview` part feeds too.
 * @internal
 */
export interface ResolvedDragPreview {
  offset: DraggablePreviewOffset | undefined;
  modifiers: DraggableRootModifiers | undefined;
  /** Already resolved to an element. `null` inserts the preview beside the source. */
  container: HTMLElement | null;
  disabled: boolean;
  /** React content for a custom preview; `null` for a clone of the source. */
  render: ((parameters: DraggablePreviewRenderParameters<any>) => React.ReactNode) | null;
}

/**
 * Read once at drag start. The engine builds the preview synchronously from these,
 * before React can run.
 */
function resolveDragPreview(
  parameters: DraggableConfig<any, any>,
  source: HTMLElement,
): ResolvedDragPreview {
  const settings = parameters.preview;
  const disabled = settings?.disabled ?? false;

  return {
    offset: settings?.offset,
    modifiers: settings?.modifiers,
    // Can be a callback, so leave it uninvoked when the preview is disabled.
    container: disabled ? null : resolveElementReference(settings?.container, source),
    disabled,
    render: settings?.render ?? null,
  };
}

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
   * Where the user pressed. The grab offset anchors here, since the activation
   * threshold puts `initialInput` a few pixels past the press.
   */
  pressPoint: { x: number; y: number };
  /** What the sensor lends the session (see `StartParameters.sensor`). */
  sensor?: DragSessionSensor | undefined;
  /** Whether the sensor still owns the pickup after consumer callbacks. */
  isPickupCurrent: () => boolean;
}

/** The element under a client point, excluding the drag's own preview. */
export function hitTestUnderPreview(
  element: Element,
  preview: DragPreview,
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
  preview: DragPreview;
}

/**
 * Build the preview for a pickup and start the lifecycle session. When the pickup
 * throws or the lifecycle refuses to start (a drag is already running or the
 * pickup was canceled), the preview and root lock are released here, so the sensor
 * only cleans up its own pre-pickup state. A throw is re-thrown after the undo.
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
    sensor,
    isPickupCurrent,
  } = parameters;
  const element = dragSource.element;

  let preview: DragPreview | null = null;
  let locked = false;

  const undo = () => {
    if (preview) {
      preview.end(false);
    }
    if (locked) {
      dragRootLock.unlock();
    }
  };

  try {
    // A source whose previous clone is still settling carries `data-dragging` and
    // `data-settling`. Finish that clone so the source is measured without them.
    finishEndingPreview(element);
    // Measured before `markSourceDragging()`, whose `[data-dragging]` rules could
    // corrupt the grab offset behind `getSnappedLocalPoint({ anchor: 'source' })`.
    const pickupRect = element.getBoundingClientRect();
    const grabOffset = {
      x: pressPoint.x - pickupRect.left,
      y: pressPoint.y - pickupRect.top,
    };
    // For the preview's default `'source'` offset. The preview anchors on its
    // untransformed box, so it can't reuse `grabOffset`, which is relative to the
    // transformed rect.
    const pressInput: DraggableInput = {
      ...initialInput,
      clientX: pressPoint.x,
      clientY: pressPoint.y,
    };

    const previewSettings = resolveDragPreview(draggableParameters, element);
    if (!isPickupCurrent()) {
      return null;
    }
    preview = createDragPreview(
      element,
      getPreviewSourceIdentity(draggableParameters),
      previewSettings,
      initialInput,
      pressInput,
    );
    dragRootLock.lock(element);
    locked = true;
    // Place the preview now so the first frame doesn't leave it off-screen. The
    // pickup's modifier keys go along, for key-gated preview modifiers.
    preview.update(initialInput.clientX, initialInput.clientY, initialInput);

    if (!isPickupCurrent()) {
      undo();
      return null;
    }

    // Read the latest parameters on each dispatch, so a source that re-renders
    // mid-drag runs its current handlers. Falls back to the last snapshot if the
    // element unregisters or changes kind (the kind is fixed for the session). Reads
    // `dragSource.element`, not `element`: a virtualizer remount re-points it at the
    // new node (see `retargetDragSource`), and only that node is registered.
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
      onRelease: (dropped) => {
        if (dropped) {
          sessionPreview.markDropped();
        }
      },
      // The session publishes it before `start()` dispatches `onGenerateDragPreview`,
      // where the React layer reads the custom preview content from it.
      preview: sessionPreview,
      sensor,
    });
    if (!session) {
      undo();
      return null;
    }
    return { session, preview: sessionPreview };
  } catch (error) {
    undo();
    throw error;
  }
}
