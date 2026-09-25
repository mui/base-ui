/**
 * The prebuilt `modifiers`. A modifier clamps or snaps the drag point
 * each frame: on `Draggable.Root` it governs the preview, the drop hit-test and
 * the pointer hit test; on a preview part it governs the preview alone.
 */

import { ownerWindow } from '@base-ui/utils/owner';
import { clamp } from '@base-ui/utils/clamp';
import {
  containConsumerError,
  getComposedParentElement,
  getElementScale,
  getViewportSize,
  resolveElementReference,
  NO_MODIFIER_KEYS,
  type DragModifierKeys,
} from './utils';
import type {
  DraggableRootModifier,
  DraggableRootModifierContext,
  DraggableRootModifiers,
  DraggableRootElementReference,
  DraggablePosition,
} from '../../types/drag';

const ZERO_OFFSET: DraggablePosition = { x: 0, y: 0 };

/**
 * Clamp the point so the preview stays inside `rect`. The preview sits at
 * `point − previewOffset`, so both edges shift by the offset: on `Draggable.Root`
 * this contains the preview the user actually sees rather than the bare cursor;
 * on a preview part the offset is zero and `point` is the top-left itself.
 */
function clampPointToRect(
  context: DraggableRootModifierContext,
  rect: Pick<DOMRect, 'left' | 'top' | 'right' | 'bottom' | 'width' | 'height'>,
): DraggablePosition {
  const { point } = context;
  // An element that went `display: none` (or detached) mid-drag reports a 0×0
  // rect at the origin; clamping to it would pin the whole drag to (0, 0).
  // Treat a zero-size rect as "no modifier" and pass the point through.
  if (rect.width === 0 && rect.height === 0) {
    return point;
  }
  const { previewRect, previewOffset } = context;
  const width = previewRect?.width ?? 0;
  const height = previewRect?.height ?? 0;
  return {
    x: clamp(
      point.x,
      rect.left + previewOffset.x,
      Math.max(rect.left + previewOffset.x, rect.right - width + previewOffset.x),
    ),
    y: clamp(
      point.y,
      rect.top + previewOffset.y,
      Math.max(rect.top + previewOffset.y, rect.bottom - height + previewOffset.y),
    ),
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
export const restrictToWindowEdges: DraggableRootModifier = (context) => {
  const { width, height } = getViewportSize(context.ownerWindow);
  return clampPointToRect(context, {
    left: 0,
    top: 0,
    right: width,
    bottom: height,
    width,
    height,
  });
};

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
  // Composed parent: a draggable that is a direct child of a shadow root clamps
  // to the host instead of silently becoming a no-op.
  const parent = getComposedParentElement(context.sourceElement);
  if (!parent) {
    return context.point;
  }
  return clampPointToRect(context, parent.getBoundingClientRect());
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

// Round the distance from the origin to the nearest grid step symmetrically:
// `Math.round` alone rounds half steps toward +∞, so a half-step drag would snap
// a full step to the right but stay put to the left.
function snapDelta(delta: number, step: number): number {
  return Math.sign(delta) * Math.round(Math.abs(delta) / step) * step;
}

/**
 * Normalize a `modifiers` declaration to a non-empty list, or `null` when
 * there is nothing to apply, so a caller can skip the work (and the drag-start
 * measurements that feed the context) entirely.
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
  const list = (
    modifiers as ReadonlyArray<DraggableRootModifier | false | null | undefined>
  ).filter((modifier): modifier is DraggableRootModifier => Boolean(modifier));
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
  /** Measures the preview; invoked at most once, and only when a modifier reads `previewRect`. */
  getPreviewRect: () => DOMRect | null;
}

/**
 * Run a compiled modifier list over a point, left-to-right (each constrains
 * the previous one's result). `previewRect` is measured lazily and at most once
 * per application: the common modifiers (axis locks, grid snaps) never read
 * it, so they must not pay for the layout read.
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
  // Contained: modifiers run inside the pointer sensor's animation frame, where
  // an uncaught throw would strand the drag. One
  // unconstrained move beats a broken gesture.
  return containConsumerError(
    'Base UI: a drag "modifiers" function threw, leaving this move unconstrained.',
    options.sourceElement,
    () => {
      let current = point;
      for (const modifier of modifiers) {
        current = modifier({
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
 * drag-start measures every application shares.
 * @internal
 */
export interface DragModifiersState {
  modifiers: ReadonlyArray<DraggableRootModifier>;
  /**
   * The (already constrained) drag-start point — the reference an axis lock or
   * grid snaps against, and the point the session should start from.
   */
  initialPoint: DraggablePosition;
  sourceElement: HTMLElement;
  /** The source's rect at drag start, measured before `[data-dragging]` can restyle it. */
  sourceRect: DOMRect;
  /**
   * The scale the transforms over the source and its ancestors apply to it, measured at
   * drag start (see `getElementScale`).
   */
  scale: DraggablePosition;
}

/**
 * Compile a draggable's `modifiers` for a starting drag, or `null` when it
 * declared none. Measures the source rect only when there is something to apply
 * — call before the session starts, so `[data-dragging]` styles can't corrupt
 * the measure. The start point is constrained immediately and becomes
 * `initialPoint`: the drag begins where its first frame will resolve, and axis
 * locks or grid snaps anchor there rather than at a point a rect clamp already
 * moved away from.
 * @internal
 */
export function createDragModifiersState(
  declared: DraggableRootModifiers | undefined,
  sourceElement: HTMLElement,
  startPoint: DraggablePosition,
  options: {
    /** The pickup event's modifier keys, for the initial apply. */
    keys?: DragModifierKeys | undefined;
    /** Overrides how the source is measured, for a caller that already has the rect. */
    measureSourceRect?: (() => DOMRect) | undefined;
  } = {},
): DragModifiersState | null {
  const modifiers = compileDragModifiers(declared);
  if (!modifiers) {
    return null;
  }
  const { keys = NO_MODIFIER_KEYS, measureSourceRect } = options;
  const sourceRect = measureSourceRect
    ? measureSourceRect()
    : sourceElement.getBoundingClientRect();
  const state: DragModifiersState = {
    modifiers,
    initialPoint: startPoint,
    sourceElement,
    sourceRect,
    scale: getElementScale(sourceElement),
  };
  // No preview exists yet at drag start; rect modifiers clamp the bare point. The keys
  // are the pickup event's, so a drag begun with a modifier already held starts
  // constrained rather than waiting for the first move.
  state.initialPoint = modifyDragPoint(state, startPoint, null, keys);
  return state;
}

/**
 * Apply a session's compiled modifiers to a pointer position. The preview handle supplies the measures only some
 * modifiers read: its rect, and the offset from its top-left to the cursor, so
 * rect modifiers contain the preview rather than the bare cursor.
 * @internal
 */
export function modifyDragPoint(
  state: DragModifiersState,
  point: DraggablePosition,
  preview: ModifierPreviewLike | null,
  keys: DragModifierKeys = NO_MODIFIER_KEYS,
): DraggablePosition {
  return applyDragModifiers(state.modifiers, point, {
    initialPoint: state.initialPoint,
    input: point,
    sourceElement: state.sourceElement,
    sourceRect: state.sourceRect,
    scale: state.scale,
    previewOffset: preview?.getPreviewOffset() ?? ZERO_OFFSET,
    keys,
    ownerWindow: ownerWindow(state.sourceElement),
    getPreviewRect: () => preview?.getPreviewElement()?.element.getBoundingClientRect() ?? null,
  });
}
