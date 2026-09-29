import { clamp } from '@base-ui/utils/clamp';
import { ownerWindow } from '@base-ui/utils/owner';
import { getFiniteAnimations } from '../../getFiniteAnimations';
import { WindowAnimationFrame } from '../../windowAnimationFrame';
import { WindowTimeout } from '../../windowTimeout';
import { measurePreviewSource } from './cloneDragPreview';
import type { DragPreviewElementHandle } from './cloneDragPreview';
import type { DraggablePosition } from '../../../draggable/DraggableProvider';
import type { DraggableRootModifier } from '../../../draggable/root/DraggableRoot';
import type { DragModifierKeys } from '../utils';
import { applyDragModifiers } from '../dragModifiers';
import { getSharedSlot } from '../sharedState';
import * as DraggablePreviewDataAttributes from '../../../draggable/preview/DraggablePreviewDataAttributes';
import * as DraggableRootDataAttributes from '../../../draggable/root/DraggableRootDataAttributes';
import { getElementScale, NO_MODIFIER_KEYS } from '../utils';

const ZERO_OFFSET: DraggablePosition = { x: 0, y: 0 };
/** What `getElementScale` reports for an element with no ancestor transform. */
const DEFAULT_SCALE: DraggablePosition = { x: 1, y: 1 };
const MIN_SETTLING_WATCHDOG_MS = 1000;
const MAX_SETTLING_WATCHDOG_MS = 30000;

export interface SyntheticPreviewSourceIdentity {
  kind: symbol;
  previewKey: string | number | undefined;
  /** The declared payload, used to reconnect the preview after a source remounts. */
  payload: unknown;
}

/** A released clone still running its drop transition onto `source`. */
interface EndingPreview {
  identity: SyntheticPreviewSourceIdentity;
  readonly source: Element;
  retarget(element: HTMLElement): void;
  finish(): void;
}

// Clones still running their drop transition. A new pickup from the same source
// interrupts the previous one. Shared across bundles, like the active drag state.
const endingPreviews = getSharedSlot('dragPreview.ending', () => new Set<EndingPreview>());

function findEndingPreview(source: Element): EndingPreview | undefined {
  for (const entry of endingPreviews) {
    if (entry.source === source) {
      return entry;
    }
  }
  return undefined;
}

/**
 * Finish the clone still settling onto `source`, if any. A new pickup calls this
 * before it measures and clones the source, which would otherwise still carry
 * `data-dragging` and `data-settling` and the styles keyed on them.
 */
export function finishEndingPreview(source: Element): void {
  findEndingPreview(source)?.finish();
}

/**
 * Finish every settling clone. Test-only, so a test that ends right after a drop
 * does not leave its clone in the document for the next one.
 */
export function finishAllEndingPreviewsForTests(): void {
  for (const entry of Array.from(endingPreviews)) {
    entry.finish();
  }
}

/**
 * Point a settling clone at a draggable that remounted in the drop commit.
 * A cross-container move creates a new React subtree, so the active-drag retargeting
 * path cannot link the old and new ref callbacks.
 */
export function retargetEndingPreviewSource(
  element: HTMLElement,
  identity: SyntheticPreviewSourceIdentity,
): void {
  for (const entry of endingPreviews) {
    if (entry.source.isConnected || entry.identity.kind !== identity.kind) {
      continue;
    }

    const sameDeclaredPayload =
      identity.payload !== undefined && Object.is(entry.identity.payload, identity.payload);
    const samePreviewKey =
      identity.previewKey !== undefined &&
      Object.is(entry.identity.previewKey, identity.previewKey);
    if (sameDeclaredPayload || samePreviewKey) {
      entry.retarget(element);
      return;
    }
  }
}

/**
 * `modifiers` are the compiled preview-level modifiers, or `null` for none. They
 * constrain where the preview is drawn, not the drag itself.
 */
export function createSyntheticPreview(
  initialSourceElement: Element,
  sourceIdentity: SyntheticPreviewSourceIdentity,
  modifiers: ReadonlyArray<DraggableRootModifier> | null,
): SyntheticPreviewHandle {
  // Re-pointed when a virtualizer remounts the dragged item to a new node, so the
  // drag-state attribute follows the live element, as `isDragging` does.
  let sourceElement: Element = initialSourceElement;
  let destroyed = false;
  let preparedForDrop = false;
  // Whether the released clone is still running its drop transition.
  let settling = false;

  // The element that follows the pointer. It is a clone of the source or the host a
  // `Draggable.Preview` renders into, and lives beside the source or in the
  // configured `container`. The sensor moves it through `update`.
  let previewElement: DragPreviewElementHandle | null = null;
  let previewOffsetX = 0;
  let previewOffsetY = 0;
  let lastX = 0;
  let lastY = 0;
  let hasPosition = false;
  // The preview's proposed top-left on the first frame positioned with the
  // current offset. Preview-level axis locks and grids snap against it. Reset
  // whenever the offset changes (a callback offset resolving late), so the anchor
  // never comes from a stale offset.
  let initialProposed: DraggablePosition | null = null;
  // The ancestor scale applied to the preview. `getElementScale` walks to the root
  // reading computed styles, so it is measured once instead of on every frame. It
  // only changes if an ancestor transform changes, which does not happen mid-drag.
  //
  // Only the modifiers use it, so it is read lazily in that branch. It does not
  // depend on size, so an empty host that React has not filled yet measures the
  // same. It does need a rendered element. Browsers resolve computed transforms to
  // matrices only for rendered elements, so a host a re-render tore out (see
  // `ensureConnected`), or one under `display: none`, would cache `1` for the rest
  // of the drag. `getClientRects` checks this without requiring a size. An empty
  // host still reports a box, while a hidden or detached one reports none.
  let previewScale: DraggablePosition | null = null;
  // The last coordinates written to the current preview. Axis locks and grid
  // snaps often resolve several pointer samples to the same point, and skipping an
  // identical `translate` avoids invalidating style.
  let positionedElement: HTMLElement | null = null;
  let positionedX = 0;
  let positionedY = 0;
  // The modifier keys of the event behind the latest position, so preview modifiers
  // see the same key state as root modifiers. Stored here because
  // `positionPreviewElement` also runs from `setPreviewOffset`, which has no event.
  let lastKeys: DragModifierKeys = NO_MODIFIER_KEYS;

  function positionPreviewElement(): void {
    if (!previewElement) {
      return;
    }
    const currentPreview = previewElement;
    const element = currentPreview.element;
    // A virtualizer can recycle the source's row (and its parent) mid-drag,
    // taking the clone's host with it. Re-home it before writing the position.
    currentPreview.ensureConnected();
    let proposedX = lastX - previewOffsetX;
    let proposedY = lastY - previewOffsetY;
    initialProposed ??= { x: proposedX, y: proposedY };
    if (modifiers) {
      if (previewScale === null && element.getClientRects().length > 0) {
        previewScale = getElementScale(element);
      }
      const constrained = applyDragModifiers(
        modifiers,
        { x: proposedX, y: proposedY },
        {
          initialPoint: initialProposed,
          input: { x: lastX, y: lastY },
          sourceElement: sourceElement as HTMLElement,
          sourceRect: currentPreview.sourceRect,
          // These modifiers move the preview, so a step in its own units uses the
          // preview's scale, not the source's.
          scale: previewScale ?? DEFAULT_SCALE,
          // `point` is the top-left itself here, so the offset is zero.
          previewOffset: ZERO_OFFSET,
          keys: lastKeys,
          ownerWindow: ownerWindow(element),
          getPreviewRect: () => element.getBoundingClientRect(),
        },
      );
      if (destroyed || previewElement !== currentPreview) {
        return;
      }
      proposedX = constrained.x;
      proposedY = constrained.y;
    }
    // Write `translate`, not `transform`. The individual properties compose as
    // `translate × rotate × scale × transform`, so `translate` is outermost and a
    // consumer `rotate`/`scale` turns the preview about its own box. Through
    // `transform`, the shared `transform-origin` would sit at the box's layout
    // position. The preview is `fixed` at 0,0, so that is the viewport corner, and
    // a `rotate: 4deg` would swing the preview dozens of pixels off the pointer.
    proposedX /= currentPreview.positionScale.x;
    proposedY /= currentPreview.positionScale.y;
    if (element !== positionedElement || proposedX !== positionedX || proposedY !== positionedY) {
      element.style.translate = `${proposedX}px ${proposedY}px`;
      positionedElement = element;
      positionedX = proposedX;
      positionedY = proposedY;
    }
  }

  function retargetSource(element: HTMLElement): void {
    if ((destroyed && !settling) || element === sourceElement) {
      return;
    }

    sourceElement.removeAttribute(DraggableRootDataAttributes.dragging);
    sourceElement.removeAttribute(DraggableRootDataAttributes.settling);
    if (settling) {
      // A fresh drag from the destination can begin before this one settles.
      // It owns that source now, so finish the older preview first.
      findEndingPreview(element)?.finish();
    }

    sourceElement = element;
    sourceElement.setAttribute(DraggableRootDataAttributes.dragging, '');
    if (settling) {
      sourceElement.setAttribute(DraggableRootDataAttributes.settling, '');
    }
  }

  return {
    update(clientX: number, clientY: number, keys: DragModifierKeys = NO_MODIFIER_KEYS): void {
      if (destroyed) {
        return;
      }
      lastX = clientX;
      lastY = clientY;
      lastKeys = keys;
      hasPosition = true;
      positionPreviewElement();
    },
    setPreviewElement(preview: DragPreviewElementHandle): void {
      previewElement = preview;
    },
    markSourceDragging(): void {
      finishEndingPreview(sourceElement);
      // Set only after the preview is built. A `[data-dragging]` rule that changes
      // the source's geometry or hides it would otherwise corrupt the measurement
      // the clone is sized from.
      sourceElement.setAttribute(DraggableRootDataAttributes.dragging, '');
    },
    retargetSource,
    setPreviewOffset(offset: DraggablePosition): void {
      // A callback offset on a `Draggable.Preview` resolves only after React renders
      // the content and the host has a size, which is after the engine placed it.
      // Re-anchor then, without waiting for a pointer move.
      previewOffsetX = offset.x;
      previewOffsetY = offset.y;
      initialProposed = null;
      if (!destroyed && hasPosition) {
        positionPreviewElement();
      }
    },
    removePreviewElement(): void {
      previewElement?.destroy();
      previewElement = null;
      // The offsets described the removed box. Left set, rect modifiers
      // (`restrictToElement`, `restrictToWindowEdges`) would keep clamping against
      // it, for example after a `Draggable.Preview` renders `null`.
      previewOffsetX = 0;
      previewOffsetY = 0;
    },
    getPreviewElement(): DragPreviewElementHandle | null {
      return previewElement;
    },
    getPreviewOffset(): DraggablePosition {
      return { x: previewOffsetX, y: previewOffsetY };
    },
    prepareForDrop(): void {
      preparedForDrop = true;
    },
    destroy(): void {
      if (destroyed) {
        return;
      }
      destroyed = true;
      const endingPreview = previewElement;
      previewElement = null;

      // React owns custom previews and releases their content with the drag
      // session. The engine owns clones, so a clone can stay mounted until the
      // consumer's drop transition finishes.
      if (preparedForDrop && endingPreview && !endingPreview.isHost) {
        const element = endingPreview.element;
        const frame = new WindowAnimationFrame(ownerWindow(element));
        const settlingWatchdog = new WindowTimeout(ownerWindow(element));
        const entry: EndingPreview = {
          identity: sourceIdentity,
          get source() {
            return sourceElement;
          },
          retarget: retargetSource,
          finish() {
            if (!endingPreviews.delete(entry)) {
              return;
            }
            frame.cancel();
            settlingWatchdog.clear();
            endingPreview.destroy();
            sourceElement.removeAttribute(DraggableRootDataAttributes.dragging);
            sourceElement.removeAttribute(DraggableRootDataAttributes.settling);
            settling = false;
          },
        };
        const cleanup = () => entry.finish();

        findEndingPreview(sourceElement)?.finish();
        settling = true;
        endingPreviews.add(entry);
        sourceElement.setAttribute(DraggableRootDataAttributes.settling, '');
        element.setAttribute(DraggablePreviewDataAttributes.endingStyle, '');
        endingPreview.prepareForDrop();

        // State updates that drop handlers schedule later in the release event are
        // committed before this frame. Measuring then targets the source's final
        // slot, not the slot it held when the pointer came up.
        frame.request(() => {
          endingPreview.ensureConnected();
          // A source that renders no box while the preview does, such as one a
          // `[data-dragging] { display: none }` rule hides, measures as a zero rect
          // at the viewport corner. There is nothing to settle onto.
          if (
            !sourceElement.isConnected ||
            !element.isConnected ||
            (sourceElement.getClientRects().length === 0 && element.getClientRects().length > 0)
          ) {
            cleanup();
            return;
          }

          const { sourceRect: destination } = measurePreviewSource(sourceElement as HTMLElement);
          element.style.translate = `${destination.left / endingPreview.positionScale.x}px ${destination.top / endingPreview.positionScale.y}px`;

          const animations =
            globalThis.BASE_UI_ANIMATIONS_DISABLED || !element.getAnimations
              ? []
              : getFiniteAnimations(element);
          if (animations.length === 0) {
            cleanup();
            return;
          }
          const longestAnimationMs = animations.reduce((longest, animation) => {
            const endTime = animation.effect?.getComputedTiming?.().endTime;
            return typeof endTime === 'number' && Number.isFinite(endTime)
              ? Math.max(longest, endTime)
              : longest;
          }, 0);
          settlingWatchdog.start(
            clamp(longestAnimationMs + 100, MIN_SETTLING_WATCHDOG_MS, MAX_SETTLING_WATCHDOG_MS),
            cleanup,
          );
          Promise.allSettled(animations.map((animation) => animation.finished)).then(cleanup);
        });
        return;
      }

      endingPreview?.destroy();
      sourceElement.removeAttribute(DraggableRootDataAttributes.dragging);
    },
  };
}

export interface SyntheticPreviewHandle {
  /** `keys` are the modifier keys of the event behind this position, for preview modifiers. */
  update(clientX: number, clientY: number, keys?: DragModifierKeys): void;
  /**
   * Adopt the preview element to position with the drag, before the first `update`.
   * The engine writes only its `translate`.
   */
  setPreviewElement(preview: DragPreviewElementHandle): void;
  /**
   * Mark the source as being dragged. Called once the preview exists, so a
   * `[data-dragging]` rule can't affect the geometry the preview was measured from.
   */
  markSourceDragging(): void;
  /** Follow the drag source to a fresh node when a virtualizer remounts it mid-drag. */
  retargetSource(element: HTMLElement): void;
  /**
   * Set the offset from the preview's top-left to the cursor. Called at pickup, or
   * once React has rendered content into the preview and it has a size.
   */
  setPreviewOffset(offset: DraggablePosition): void;
  /** Destroy the preview element. */
  removePreviewElement(): void;
  /** The adopted preview element, or `null`. */
  getPreviewElement(): DragPreviewElementHandle | null;
  /** The offset from the preview's top-left to the cursor (see `setPreviewOffset`). */
  getPreviewOffset(): DraggablePosition;
  /** Preserve an engine-owned clone long enough to animate it back to the source after release. */
  prepareForDrop(): void;
  destroy(): void;
}
