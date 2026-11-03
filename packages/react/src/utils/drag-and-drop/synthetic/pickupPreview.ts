/**
 * The pickup: build the drag preview, take the root lock, and start the lifecycle
 * session. The pointer sensor runs it when a gesture activates, and the session
 * releases what it acquires (see `sensor.release`).
 */

import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import * as dragRootLock from './dragRootLock';
import {
  createDragPreview,
  finishEndingPreview,
  getPreviewSourceIdentity,
} from './syntheticPreview';
import type { DragPreview, DragPreviewSize } from './syntheticPreview';
import { start } from '../core/lifecycleManager';
import type { DragSessionController, DragSessionSensor } from '../core/lifecycleManager';
import { getRegistrationOwner } from '../draggableRegistry';
import { readSourceParameters } from '../dragSource';
import { getClosedShadowRootsByHost } from '../dropTarget';
import type { DraggableConfig } from '../draggable';
import {
  elementFromPointIgnoring,
  getComposedParentElement,
  getElementScale,
  getOwnZoom,
} from '../utils';
import { getOwnLinearTransform } from '../linearTransform';
import type { DragStartReason } from '../types';
import type { DraggableInput } from '../../../draggable/DraggableProvider';
import type { DraggableRootRecord } from '../../../draggable/root/DraggableRoot';

/**
 * Measure a source at pickup, once, for the grab offset and the modifiers. A source
 * whose previous preview is still settling carries `data-dragging` and `data-settling`,
 * so that preview is finished first.
 */
export function measurePickupSource(element: HTMLElement): DOMRect {
  finishEndingPreview(element);
  return element.getBoundingClientRect();
}

/**
 * The source's border-box size in viewport pixels, without its own transform and `zoom`.
 * A preview that renders the trigger again keeps its `scale`, `rotate`, `transform` and
 * `zoom`, which `rect` already includes, so sizing it from `rect` would apply them twice.
 */
export function measureSourceSize(element: HTMLElement, rect: DOMRect): DragPreviewSize {
  const style = ownerWindow(element).getComputedStyle(element);
  const { a, b, c, d } = getOwnLinearTransform(style);
  if (a === 1 && b === 0 && c === 0 && d === 1) {
    // Only translated, if at all. The rect keeps the subpixels `offsetWidth` rounds off.
    const zoom = getOwnZoom(element, style);
    return { width: rect.width / zoom, height: rect.height / zoom };
  }
  const parent = getComposedParentElement(element) as HTMLElement | null;
  const parentScale = parent ? getElementScale(parent) : { x: 1, y: 1 };
  const box = getUntransformedBorderBox(element, style);
  return { width: box.width * parentScale.x, height: box.height * parentScale.y };
}

/**
 * The untransformed border-box size in the element's own CSS pixels. The computed size
 * keeps the subpixels `offsetWidth`/`offsetHeight` round off, but is trusted only within
 * 1px of them: it is `auto` on an inline box, and Chromium leaves a classic scrollbar
 * out of the computed content width.
 */
function getUntransformedBorderBox(element: HTMLElement, style: CSSStyleDeclaration) {
  const px = (value: string) => Number.parseFloat(value) || 0;
  const isBorderBox = style.boxSizing === 'border-box';
  const measure = (size: string, rounded: number, edges: string[]) => {
    const value = Number.parseFloat(size);
    if (!Number.isFinite(value)) {
      return rounded;
    }
    const exact = isBorderBox ? value : edges.reduce((sum, edge) => sum + px(edge), value);
    return Math.abs(exact - rounded) < 1 ? exact : rounded;
  };
  return {
    width: measure(style.width, element.offsetWidth, [
      style.paddingLeft,
      style.paddingRight,
      style.borderLeftWidth,
      style.borderRightWidth,
    ]),
    height: measure(style.height, element.offsetHeight, [
      style.paddingTop,
      style.paddingBottom,
      style.borderTopWidth,
      style.borderBottomWidth,
    ]),
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
  /** The source's rect from `measurePickupSource`. */
  sourceRect: DOMRect;
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
    preview.getPreviewElement(),
    getClosedShadowRootsByHost(),
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
    sourceRect,
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
    // From the rect measured before `markSourceDragging()`, whose `[data-dragging]`
    // rules could corrupt the offset behind `getSnappedLocalPoint({ anchor: 'source' })`.
    const grabOffset = {
      x: pressPoint.x - sourceRect.left,
      y: pressPoint.y - sourceRect.top,
    };
    // For the preview's default `'source'` offset.
    const pressInput: DraggableInput = {
      ...initialInput,
      clientX: pressPoint.x,
      clientY: pressPoint.y,
    };

    preview = createDragPreview(
      element,
      getPreviewSourceIdentity(draggableParameters, getRegistrationOwner(element)),
      {
        sourceRect,
        sourceSize: measureSourceSize(element, sourceRect),
        input: initialInput,
        pressInput,
      },
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
      latest = readSourceParameters(dragSource) ?? latest;
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
