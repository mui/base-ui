/**
 * Shared session bootstrap for the pointer and keyboard sensors.
 *
 * Both sensors build the same preview, drag payload, and source-handler map
 * from a draggable's parameters and hand them to the lifecycle
 * ({@link createPreviewAndStartSession}). Sensor-specific resources (the
 * pointer sensor's root lock) plug in through `acquire`/`release`.
 */

import { start, type DragSessionHandle, type SourceHandlers } from './lifecycleManager';
import { getRegistration } from '../draggableRegistry';
import { setActivePreviewHandle } from '../activePreview';
import { resolveDragPreview } from '../synthetic/dragPreviewSettings';
import { compileDragModifiers } from '../dragModifiers';
import { attachDefaultDragPreview } from '../synthetic/defaultDragPreview';
import { createSyntheticPreview, type SyntheticPreviewHandle } from '../synthetic/syntheticPreview';
import type { DraggableConfig } from '../draggable';
import type { DragMode, DragSource, DragInput } from '../../../types/drag';

export interface StartSensorSessionParameters {
  mode: DragMode;
  /** The draggable's latest parameters (label/kind/payload/event handlers). */
  draggableParameters: DraggableConfig<any>;
  element: HTMLElement;
  dragHandle: Element | null;
  initialInput: DragInput;
  initialTarget: Element | null;
  /**
   * The native event the pickup committed on (see `StartParameters.initialEvent`),
   * so `onDragStart` reports a real event rather than a placeholder.
   */
  initialEvent?: Event | undefined;
  /** The engine-managed preview, so the lifecycle can skip it when hit-testing. */
  preview: SyntheticPreviewHandle;
  /** The pickup grab offset (see `StartParameters.grabOffset`). */
  grabOffset?: { x: number; y: number } | undefined;
  /** Sensor-side force-cleanup, run from the lifecycle's teardown path. */
  onForceCleanup: () => void;
}

/**
 * Resolve the draggable's `payload`, build the `DragSource` and the
 * source-handler map, then start the lifecycle. Returns the session handle, or
 * `null` when the lifecycle declined to start (a concurrent drag is already
 * active).
 *
 * Module-private: sensors go through `createPreviewAndStartSession` below, which
 * wraps this with the preview and undo handling a bare session start skips.
 */
function startSensorSession(parameters: StartSensorSessionParameters): DragSessionHandle | null {
  const {
    mode,
    draggableParameters: source,
    element,
    dragHandle,
    initialInput,
    initialTarget,
    initialEvent,
    preview,
    grabOffset,
    onForceCleanup,
  } = parameters;

  // Resolve on `typeof`, not nullishness: a payload of `0`, `''` or `false` is a
  // value the consumer meant to attach, not an absent one.
  const declaredPayload = source.payload;
  const payload =
    typeof declaredPayload === 'function'
      ? declaredPayload({ input: initialInput, element, dragHandle })
      : declaredPayload;

  const dragSource: DragSource = {
    element,
    label: source.label,
    kind: source.kind.id,
    dragHandle,
    payload,
  };

  // Read the draggable's latest parameters live on each dispatch so a source that
  // re-renders mid-drag runs its current handler closures. Falls back to the
  // start-time `source` snapshot if the element unregisters mid-drag.
  // `label`/`kind`/`payload` stay start-time (they live in `dragSource`); only
  // handlers are read fresh.
  //
  // Read `dragSource.element` rather than the start-time `element`: a virtualizer
  // can remount the source to a fresh node mid-drag, which re-registers under
  // the new element and re-points `dragSource.element` at it (see
  // `updateDragSourceElement`). The old element's registration is gone, so
  // resolving against the live node keeps the fresh handler closures flowing.
  const getLatestParameters = (): DraggableConfig<any> =>
    getRegistration(dragSource.element)?.() ?? source;

  const getSourceHandlers = (): SourceHandlers => {
    // `DraggableConfig` is a structural superset of `SourceHandlers`. Returning
    // the live registration directly avoids copying its six callbacks into a
    // short-lived object on every drag dispatch.
    return getLatestParameters();
  };

  return start({
    mode,
    payload: dragSource,
    getSourceHandlers,
    initialInput,
    initialTarget,
    initialEvent,
    grabOffset,
    synthetic: {
      getPreviewElement: () => preview.getPreviewElement()?.element ?? null,
    },
    onForceCleanup,
  });
}

export interface CreatePreviewSessionParameters extends Omit<
  StartSensorSessionParameters,
  'initialTarget' | 'preview'
> {
  /**
   * Resolve the initial drop target. Called once the preview exists, so the
   * keyboard sensor can hit-test around its own preview element; the pointer
   * sensor resolves the target before the preview is built and ignores the
   * argument.
   */
  getInitialTarget: (preview: SyntheticPreviewHandle) => Element | null;
  /**
   * Where the user pressed, when the gesture has a press. The grab offset
   * anchors here rather than at `initialInput`: the activation threshold puts
   * the committed input a few pixels past the press, and the point the user
   * took hold of is the press. Omitted (keyboard), the seed input stands in.
   */
  pressPoint?: { x: number; y: number } | undefined;
  /**
   * Acquire a sensor-specific resource once the preview handle is published
   * (the pointer sensor's root scroll lock).
   */
  acquire?: (() => void) | undefined;
  /** Undo `acquire` when the pickup throws or the lifecycle refuses. */
  release?: (() => void) | undefined;
}

export interface PreviewSessionHandle {
  session: DragSessionHandle;
  preview: SyntheticPreviewHandle;
}

/**
 * Build the engine-managed preview for a pickup and start the lifecycle session.
 *
 * On success returns the session and the preview it owns. When the pickup
 * throws or the lifecycle refuses to start (a drag is already running), every
 * resource acquired here is undone — the preview is destroyed, the published
 * handle slot is restored, `release` runs — and the sensor only has its own
 * pre-pickup state left to clean up. A throw is re-thrown after the undo.
 */
export function createPreviewAndStartSession(
  parameters: CreatePreviewSessionParameters,
): PreviewSessionHandle | null {
  const { getInitialTarget, pressPoint, acquire, release, ...sessionParameters } = parameters;
  const { draggableParameters, element, initialInput, mode } = sessionParameters;

  let preview: SyntheticPreviewHandle | null = null;
  let restoreActivePreviewSlot: (() => void) | null = null;
  let acquired = false;
  let session: DragSessionHandle | null = null;

  const undo = () => {
    restoreActivePreviewSlot?.();
    preview?.destroy();
    if (acquired) {
      release?.();
    }
  };

  try {
    // Measured before the preview is built and before `markSourceDragging()`
    // below, for the same reason the preview measures first: a `[data-dragging]`
    // rule that resizes or hides the source would corrupt the grab offset that
    // anchors `getSnappedLocalPoint({ anchor: 'source' })` for the whole drag.
    const pickupRect = element.getBoundingClientRect();
    const grabPoint = pressPoint ?? { x: initialInput.clientX, y: initialInput.clientY };
    const grabOffset = {
      x: grabPoint.x - pickupRect.left,
      y: grabPoint.y - pickupRect.top,
    };

    const previewSettings = resolveDragPreview(draggableParameters, element);
    preview = createSyntheticPreview(element, mode, {
      kind: draggableParameters.kind.id,
      label: draggableParameters.label,
      payload: draggableParameters.payload,
    });
    preview.setModifiers(compileDragModifiers(previewSettings.modifiers));
    attachDefaultDragPreview(preview, element, previewSettings, initialInput, grabOffset);
    // Only now: a `[data-dragging]` rule that resizes or hides the source would
    // otherwise corrupt the measurement the preview was just built from.
    preview.markSourceDragging();
    // Publish before the session starts: the lifecycle dispatches
    // `onGenerateDragPreview` synchronously from `startSensorSession`, and the
    // React layer resolves the preview host from this slot while handling it.
    restoreActivePreviewSlot = setActivePreviewHandle(preview, previewSettings);
    if (acquire) {
      acquire();
      acquired = true;
    }
    // Seed the preview to the current input position so the first frame
    // isn't placed at (−10000, −10000) visibly. The pickup event's keys go with it, so a
    // preview modifier gated on one is honored from the very first placement.
    preview.update(initialInput.clientX, initialInput.clientY, initialInput);

    session = startSensorSession({
      ...sessionParameters,
      initialTarget: getInitialTarget(preview),
      preview,
      grabOffset,
    });
  } catch (error) {
    undo();
    throw error;
  }

  if (!session) {
    // The lifecycle refused (a drag is already running). Restore whatever the slot
    // held before this pickup published — the refusing drag is still in progress
    // and its handle must keep flowing.
    undo();
    return null;
  }

  return { session, preview: preview! };
}
