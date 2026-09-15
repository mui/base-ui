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
} from './utils';
import type {
  DragModifier,
  DragModifierContext,
  DragModifierKeys,
  DragModifiers,
  DragElementReference,
  DragPosition,
} from '../../types/drag';

const ZERO_OFFSET: DragPosition = { x: 0, y: 0 };

/**
 * Clamp the point so the preview stays inside `rect`. The preview sits at
 * `point − previewOffset`, so both edges shift by the offset: on `Draggable.Root`
 * this contains the preview the user actually sees rather than the bare cursor;
 * on a preview part the offset is zero and `point` is the top-left itself.
 */
function clampPointToRect(context: DragModifierContext, rect: DOMRect): DragPosition {
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

/** Locks the drag to the vertical axis at its initial horizontal position. */
export const restrictToVerticalAxis: DragModifier = ({ point, initialPoint }) => ({
  x: initialPoint.x,
  y: point.y,
});

/** Locks the drag to the horizontal axis at its initial vertical position. */
export const restrictToHorizontalAxis: DragModifier = ({ point, initialPoint }) => ({
  x: point.x,
  y: initialPoint.y,
});

/** Keep the drag within the viewport. */
export const restrictToWindowEdges: DragModifier = (context) => {
  const { point, previewRect, previewOffset } = context;
  const width = previewRect?.width ?? 0;
  const height = previewRect?.height ?? 0;
  const viewport = getViewportSize(context.ownerWindow);
  return {
    x: clamp(
      point.x,
      previewOffset.x,
      Math.max(previewOffset.x, viewport.width - width + previewOffset.x),
    ),
    y: clamp(
      point.y,
      previewOffset.y,
      Math.max(previewOffset.y, viewport.height - height + previewOffset.y),
    ),
  };
};

/**
 * Keep the drag within an element's bounds. Pass the element, a ref object, or a
 * function returning it. The rect is read on every constrained move, so a
 * container that scrolls or resizes between moves is tracked.
 */
export function restrictToElement(element: DragElementReference): DragModifier {
  return (context) => {
    const target = resolveElementReference(element, undefined);
    if (!target) {
      return context.point;
    }
    return clampPointToRect(context, target.getBoundingClientRect());
  };
}

/** Keep the drag within the source element's parent. */
export const restrictToParentElement: DragModifier = (context) => {
  // Composed parent: a draggable that is a direct child of a shadow root clamps
  // to the host instead of silently becoming a no-op.
  const parent = getComposedParentElement(context.sourceElement);
  if (!parent) {
    return context.point;
  }
  return clampPointToRect(context, parent.getBoundingClientRect());
};

/**
 * Snap the drag to a grid, anchored at the point where the drag began. Pass a
 * single number for a square grid or `{ x, y }` for a rectangular one. A
 * non-positive step leaves that axis unsnapped.
 *
 * The step uses the source's coordinate system. For example, `snapToGrid(20)`
 * still snaps to a 20-unit grid when the canvas is zoomed to 70%.
 */
export function snapToGrid(size: number | { x: number; y: number }): DragModifier {
  const sizeX = typeof size === 'number' ? size : size.x;
  const sizeY = typeof size === 'number' ? size : size.y;
  return ({ point, initialPoint, scale }) => {
    const stepX = sizeX * scale.x;
    const stepY = sizeY * scale.y;
    return {
      x:
        stepX > 0
          ? initialPoint.x + Math.round((point.x - initialPoint.x) / stepX) * stepX
          : point.x,
      y:
        stepY > 0
          ? initialPoint.y + Math.round((point.y - initialPoint.y) / stepY) * stepY
          : point.y,
    };
  };
}

/**
 * Normalize a `modifiers` declaration to a non-empty list, or `null` when
 * there is nothing to apply, so a caller can skip the work (and the drag-start
 * measurements that feed the context) entirely.
 * @internal
 */
export function compileDragModifiers(
  modifiers: DragModifiers | undefined,
): ReadonlyArray<DragModifier> | null {
  if (!modifiers) {
    return null;
  }
  if (!Array.isArray(modifiers)) {
    return [modifiers as DragModifier];
  }
  const list = (modifiers as ReadonlyArray<DragModifier | false | null | undefined>).filter(
    (modifier): modifier is DragModifier => Boolean(modifier),
  );
  return list.length > 0 ? list : null;
}

/** The per-move inputs `applyDragModifiers` builds each modifier's context from. */
interface ApplyDragModifiersOptions {
  initialPoint: DragPosition;
  input: DragPosition;
  sourceElement: HTMLElement;
  sourceRect: DOMRect;
  scale: DragPosition;
  previewOffset: DragPosition;
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
  modifiers: ReadonlyArray<DragModifier>,
  point: DragPosition,
  options: ApplyDragModifiersOptions,
): DragPosition {
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
  getPreviewOffset(): DragPosition;
}

/**
 * A draggable's `modifiers` compiled for one drag session, with the
 * drag-start measures every application shares.
 * @internal
 */
export interface DragModifiersState {
  modifiers: ReadonlyArray<DragModifier>;
  /**
   * The (already constrained) drag-start point — the reference an axis lock or
   * grid snaps against, and the point the session should start from.
   */
  initialPoint: DragPosition;
  sourceElement: HTMLElement;
  /** The source's rect at drag start, measured before `[data-dragging]` can restyle it. */
  sourceRect: DOMRect;
  /**
   * The scale the transforms over the source and its ancestors apply to it, measured at
   * drag start (see `getElementScale`).
   */
  scale: DragPosition;
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
  declared: DragModifiers | undefined,
  sourceElement: HTMLElement,
  startPoint: DragPosition,
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
  point: DragPosition,
  preview: ModifierPreviewLike | null,
  keys: DragModifierKeys = NO_MODIFIER_KEYS,
): DragPosition {
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
