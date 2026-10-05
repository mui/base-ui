/**
 * The prebuilt `modifiers`. A modifier clamps or snaps the drag point each frame.
 * On `Draggable.Root` it constrains the preview and the point used for hit-testing.
 * On a preview part it constrains only the preview.
 */

import { ownerWindow } from '@base-ui/utils/owner';
import { clamp } from '@base-ui/utils/clamp';
import {
  containConsumerError,
  getComposedParentElement,
  getElementScale,
  getViewportRect,
  resolveElementReference,
} from './utils';
import type { DragModifierKeys } from './utils';
import type { DraggablePosition } from '../../draggable/DraggableProvider';
import type {
  DraggableRootModifier,
  DraggableRootModifierContext,
  DraggableRootModifiers,
  DraggableRootElementReference,
} from '../../draggable/root/DraggableRoot';

export const ZERO_OFFSET: DraggablePosition = { x: 0, y: 0 };

/**
 * Clamp the point so the preview stays inside `rect`. The preview sits at
 * `point - previewOffset`, so both edges shift by the offset. On `Draggable.Root`
 * this keeps the visible preview inside the rect, not just the cursor. On a preview
 * part the offset is zero and `point` is the top-left corner.
 */
function clampPointToRect(
  context: DraggableRootModifierContext,
  rect: Pick<DOMRect, 'left' | 'top' | 'right' | 'bottom' | 'width' | 'height'>,
): DraggablePosition {
  const { point } = context;
  // An element hidden with `display: none` or detached mid-drag reports a 0×0
  // rect at the origin. Clamping to it would pin the drag to (0, 0), so pass the
  // point through instead.
  if (rect.width === 0 && rect.height === 0) {
    return point;
  }
  const { previewRect, previewOffset } = context;
  const width = previewRect?.width ?? 0;
  const height = previewRect?.height ?? 0;
  // A preview larger than the rect pins to its leading edge, because `clamp`
  // returns the lower bound when the upper one falls below it.
  return {
    x: clamp(point.x, rect.left + previewOffset.x, rect.right - width + previewOffset.x),
    y: clamp(point.y, rect.top + previewOffset.y, rect.bottom - height + previewOffset.y),
  };
}

/** Locks the drag to the vertical axis. */
export const restrictToVerticalAxis: DraggableRootModifier = ({ point, initialPoint }) => ({
  x: initialPoint.x,
  y: point.y,
});

/** Locks the drag to the horizontal axis. */
export const restrictToHorizontalAxis: DraggableRootModifier = ({ point, initialPoint }) => ({
  x: point.x,
  y: initialPoint.y,
});

/** Keeps the drag inside the browser viewport. */
export const restrictToWindowEdges: DraggableRootModifier = (context) =>
  clampPointToRect(context, getViewportRect(context.ownerWindow));

/**
 * Keeps the drag inside an element. Accepts the element, a ref to it, or a function
 * returning it. The element is measured on every move, so it can scroll or resize
 * during the drag.
 */
export function restrictToElement(element: DraggableRootElementReference): DraggableRootModifier {
  return (context) => {
    const target = resolveElementReference(element, undefined);
    if (!target) {
      return context.point;
    }
    return clampPointToRect(context, target.getBoundingClientRect());
  };
}

/** Keeps the drag inside the source element's parent. */
export const restrictToParentElement: DraggableRootModifier = (context) => {
  // Use the composed parent, so a draggable that is a direct child of a shadow
  // root clamps to the host instead of doing nothing.
  let parent = getComposedParentElement(context.sourceElement);
  while (parent) {
    const rect = parent.getBoundingClientRect();
    // A `display: contents` parent, such as the `<slot>` a draggable is assigned
    // to, has no box and measures 0×0. The parent that lays the draggable out is
    // further up.
    if (
      rect.width !== 0 ||
      rect.height !== 0 ||
      ownerWindow(parent).getComputedStyle(parent).display !== 'contents'
    ) {
      return clampPointToRect(context, rect);
    }
    parent = getComposedParentElement(parent);
  }
  return context.point;
};

/**
 * Snaps the drag to a grid anchored where the drag started. Pass a number for a
 * square grid, or `{ x, y }` for a rectangular one. A step of `0` leaves that axis free.
 *
 * The step is in the source's own units, so `snapToGrid(20)` still snaps to a
 * 20-unit grid on a zoomed canvas.
 */
export function snapToGrid(size: number | { x: number; y: number }): DraggableRootModifier {
  const sizeX = typeof size === 'number' ? size : size.x;
  const sizeY = typeof size === 'number' ? size : size.y;
  return ({ point, initialPoint, scale }) => {
    const stepX = sizeX * scale.x;
    const stepY = sizeY * scale.y;
    return {
      x: stepX > 0 ? initialPoint.x + snapDelta(point.x - initialPoint.x, stepX) : point.x,
      y: stepY > 0 ? initialPoint.y + snapDelta(point.y - initialPoint.y, stepY) : point.y,
    };
  };
}

// Round the distance from the origin to the nearest grid step, symmetrically.
// `Math.round` alone rounds half steps toward +∞, so a half-step drag would snap
// a full step to the right but stay put to the left.
function snapDelta(delta: number, step: number): number {
  return Math.sign(delta) * Math.round(Math.abs(delta) / step) * step;
}

/**
 * Normalize a `modifiers` declaration to a non-empty list, or `null` when there
 * is nothing to apply. A caller can then skip the work, including the drag-start
 * measurements that feed the context.
 * @internal
 */
export function compileDragModifiers(
  modifiers: DraggableRootModifiers | undefined,
): ReadonlyArray<DraggableRootModifier> | null {
  if (!modifiers) {
    return null;
  }
  if (!Array.isArray(modifiers)) {
    return [modifiers as DraggableRootModifier];
  }
  const list = modifiers.filter((modifier): modifier is DraggableRootModifier => Boolean(modifier));
  return list.length > 0 ? list : null;
}

/** The per-move inputs `applyDragModifiers` builds each modifier's context from. */
interface ApplyDragModifiersOptions {
  initialPoint: DraggablePosition;
  input: DraggablePosition;
  sourceElement: HTMLElement;
  sourceRect: DOMRect;
  scale: DraggablePosition;
  previewOffset: DraggablePosition;
  /** The modifier keys held by the event that produced this move. */
  keys: DragModifierKeys;
  ownerWindow: Window;
  /** Measures the preview. Called at most once, and only when a modifier reads `previewRect`. */
  getPreviewRect: () => DOMRect | null;
}

/**
 * Run a compiled modifier list over a point, left to right. Each modifier
 * receives the previous one's result. `previewRect` is measured lazily, at most
 * once per application. Axis locks and grid snaps never read it, so they don't
 * pay for the layout read.
 * @internal
 */
export function applyDragModifiers(
  modifiers: ReadonlyArray<DraggableRootModifier>,
  point: DraggablePosition,
  options: ApplyDragModifiersOptions,
): DraggablePosition {
  let previewRect: DOMRect | null | undefined;
  const readPreviewRect = (): DOMRect | null => {
    if (previewRect === undefined) {
      previewRect = options.getPreviewRect();
    }
    return previewRect;
  };
  // Modifiers run inside the pointer sensor's animation frame, where an uncaught
  // throw would strand the drag. One unconstrained move is better than a broken gesture.
  return containConsumerError(
    'Base UI: a drag "modifiers" function threw, leaving this move unconstrained.',
    options.sourceElement,
    () => {
      let current = point;
      for (const modifier of modifiers) {
        const next = modifier({
          point: current,
          initialPoint: options.initialPoint,
          input: options.input,
          sourceElement: options.sourceElement,
          sourceRect: options.sourceRect,
          scale: options.scale,
          get previewRect() {
            return readPreviewRect();
          },
          previewOffset: options.previewOffset,
          ctrlKey: options.keys.ctrlKey,
          shiftKey: options.keys.shiftKey,
          altKey: options.keys.altKey,
          metaKey: options.keys.metaKey,
          ownerWindow: options.ownerWindow,
        });
        // A `NaN` or infinite axis, such as `snapToGrid(Infinity)` produces, would
        // make the hit-test throw on every frame. That axis keeps the modifier's
        // input instead.
        current =
          Number.isFinite(next.x) && Number.isFinite(next.y)
            ? next
            : {
                x: Number.isFinite(next.x) ? next.x : current.x,
                y: Number.isFinite(next.y) ? next.y : current.y,
              };
      }
      return current;
    },
    point,
  );
}

/** The slice of the synthetic preview handle a sensor modifier application reads. */
interface ModifierPreviewLike {
  getPreviewElement(): { element: HTMLElement } | null;
  getPreviewOffset(): DraggablePosition;
}

/**
 * A draggable's `modifiers` compiled for one drag session, with the
 * drag-start measurements every application shares.
 * @internal
 */
export interface DragModifiersState {
  modifiers: ReadonlyArray<DraggableRootModifier>;
  /**
   * The drag-start point, already constrained. Axis locks and grid snaps anchor
   * to it, and the session starts from it.
   */
  initialPoint: DraggablePosition;
  /**
   * The drag's source. Its `element` follows a remount during the drag (see
   * `retargetDragSource`), so the modifiers never read a detached node.
   */
  source: { readonly element: HTMLElement };
  /** The source's rect at drag start, measured before `[data-dragging]` can restyle it. */
  sourceRect: DOMRect;
  /**
   * The scale that transforms on the source and its ancestors apply to it, measured
   * at drag start (see `getElementScale`).
   */
  scale: DraggablePosition;
}

/**
 * Compile a draggable's `modifiers` for a starting drag, or `null` when it
 * declared none. Measures the source rect only when there is something to apply.
 * Call it before the session starts, so `[data-dragging]` styles can't skew the
 * measurement. The start point is constrained immediately and becomes
 * `initialPoint`. The drag begins where its first frame will resolve, and axis
 * locks or grid snaps anchor there instead of at a point a rect clamp already moved.
 * @internal
 */
export function createDragModifiersState(
  declared: DraggableRootModifiers | undefined,
  source: { readonly element: HTMLElement },
  startPoint: DraggablePosition,
  /** The pickup event's modifier keys, for the initial apply. */
  keys: DragModifierKeys,
): DragModifiersState | null {
  const modifiers = compileDragModifiers(declared);
  if (!modifiers) {
    return null;
  }
  const state: DragModifiersState = {
    modifiers,
    initialPoint: startPoint,
    source,
    sourceRect: source.element.getBoundingClientRect(),
    scale: getElementScale(source.element),
  };
  // No preview exists yet at drag start, so rect modifiers clamp the bare point. The
  // keys come from the pickup event, so a drag started with a modifier key held is
  // constrained from its first point rather than from the first move.
  state.initialPoint = modifyDragPoint(state, startPoint, null, keys);
  return state;
}

/**
 * Apply a session's compiled modifiers to a pointer position. The preview handle
 * supplies two measurements that only some modifiers read: its rect, and the offset
 * from its top-left corner to the cursor. Rect modifiers use them to contain the
 * preview rather than the bare cursor.
 * @internal
 */
export function modifyDragPoint(
  state: DragModifiersState,
  point: DraggablePosition,
  preview: ModifierPreviewLike | null,
  keys: DragModifierKeys,
): DraggablePosition {
  return applyDragModifiers(state.modifiers, point, {
    initialPoint: state.initialPoint,
    input: point,
    sourceElement: state.source.element,
    sourceRect: state.sourceRect,
    scale: state.scale,
    previewOffset: preview?.getPreviewOffset() ?? ZERO_OFFSET,
    keys,
    ownerWindow: ownerWindow(state.source.element),
    getPreviewRect: () => preview?.getPreviewElement()?.element.getBoundingClientRect() ?? null,
  });
}
