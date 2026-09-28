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
/** No ancestor transform: what `getElementScale` reports for an unscaled element. */
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

// A new pickup from the same source interrupts its previous drop transition.
// Shared across bundles for the same reason the active drag engine state is.
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
 * Follow a settling clone to a draggable that remounted as part of the drop commit.
 * A cross-container move creates a new React subtree, so the active-drag retargeting
 * path cannot connect the old and new ref callbacks itself.
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

export function createSyntheticPreview(
  initialSourceElement: Element,
  sourceIdentity: SyntheticPreviewSourceIdentity,
): SyntheticPreviewHandle {
  // Re-pointed when a virtualizer remounts the dragged item to a fresh node, so the
  // drag-state attribute follows the live element the way `isDragging` does.
  let sourceElement: Element = initialSourceElement;
  let destroyed = false;
  let preparedForDrop = false;
  // Whether the released clone is still running its drop transition.
  let settling = false;

  // The element that follows the pointer: a clone of the source, or the host a
  // `Draggable.Preview` renders into. It lives beside the source, or in the
  // configured `container`, and the sensor drives `update`.
  let previewElement: DragPreviewElementHandle | null = null;
  let previewOffsetX = 0;
  let previewOffsetY = 0;
  let lastX = 0;
  let lastY = 0;
  let hasPosition = false;
  // Opt-in preview-level `modifiers`, compiled to a non-empty list, or
  // `null` for none. Constrains where the preview is drawn without touching the
  // drag itself (the root's `modifiers` does that).
  let modifiers: ReadonlyArray<DraggableRootModifier> | null = null;
  // The preview's proposed top-left on the first frame positioned with the
  // current offset — the reference a preview-level axis lock or grid snaps
  // against. Reset whenever the offset changes (a callback offset resolving
  // late), so the anchor is never a proposal computed from a stale offset.
  let initialProposed: DraggablePosition | null = null;
  // The ancestor scale applied to the preview, measured once rather than per frame:
  // `getElementScale` walks to the root reading computed styles, which is a style
  // recalc this would otherwise pay for on every positioned frame. The scale can only
  // change if an ancestor's transform does, which no drag does mid-flight.
  //
  // Size-independent, so it can be read the first time a frame needs it: a declared
  // preview is handed over as an empty host that React fills afterwards, and the
  // transforms above it are the same either way. Only the modifiers consume it, so the
  // read stays behind that branch. Rendered is the one thing the read does wait for —
  // browsers resolve computed transforms to matrices only for rendered elements, so
  // measuring a host a consumer re-render tore out (see `ensureConnected`), or one
  // sitting under `display: none`, would cache `1` for the rest of the drag instead of
  // retrying once it is drawn. `getClientRects` is that signal without a size
  // requirement: an empty host still reports its box, a hidden or detached one
  // reports none.
  let previewScale: DraggablePosition | null = null;
  // The last coordinates written to the current preview. Axis locks and grid
  // snaps often resolve several pointer samples to the same point; avoid
  // invalidating style for an identical `translate`.
  let positionedElement: HTMLElement | null = null;
  let positionedX = 0;
  let positionedY = 0;
  // The modifier keys of the event behind the latest position, so preview modifiers see
  // the same key state root modifiers do. Held here rather than passed down each frame
  // because `positionPreviewElement` is also called from `setPreviewOffset`, which has
  // no event of its own.
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
          // The preview is what these modifiers move, so a step in "its own units" is
          // measured against the preview rather than the source.
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
    // The `translate` property, not `transform`: the individual properties
    // compose as `translate × rotate × scale × transform`, so `translate` is
    // outermost and a consumer `rotate`/`scale` on the preview spins it about
    // its own box. Through `transform`, the shared `transform-origin` sits at
    // the box's *layout* position (the viewport corner — the preview is `fixed`
    // at 0,0), so a `rotate: 4deg` would swing the translated preview around a
    // pivot hundreds of pixels away, dozens of pixels off the pointer.
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
      findEndingPreview(sourceElement)?.finish();
      // Set only once the preview is built: a `[data-dragging]` rule that changes
      // the source's geometry (or hides it outright) would otherwise corrupt the
      // measurement the clone is sized from.
      sourceElement.setAttribute(DraggableRootDataAttributes.dragging, '');
    },
    retargetSource,
    setPreviewOffset(offset: DraggablePosition): void {
      // A `Draggable.Preview` whose offset is a callback can only be resolved once React
      // has rendered its content and the element has a size, which happens after
      // the engine placed it. Re-anchor it then, without waiting for a pointer move
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
      // The offsets described the box that just went away. Leaving them set
      // makes rect modifiers (`restrictToElement`, `restrictToWindowEdges`)
      // keep clamping against a phantom preview after, say, a
      // `Draggable.Preview` rendered `null`.
      previewOffsetX = 0;
      previewOffsetY = 0;
    },
    getPreviewElement(): DragPreviewElementHandle | null {
      return previewElement;
    },
    getPreviewOffset(): DraggablePosition {
      return { x: previewOffsetX, y: previewOffsetY };
    },
    setModifiers(next: ReadonlyArray<DraggableRootModifier> | null): void {
      modifiers = next;
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

      // Custom previews are owned by React, whose content is released with the
      // drag session. Cloned previews are entirely engine-owned and can remain
      // mounted until a consumer-authored drop transition finishes.
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

        // Drop-handler updates scheduled later in the release event commit before
        // this frame. Measure then, so the destination is the source's final
        // slot rather than the slot it occupied when the pointer came up.
        frame.request(() => {
          endingPreview.ensureConnected();
          if (!sourceElement.isConnected || !element.isConnected) {
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
  /** Re-anchor the preview once React has rendered content into it and it has a size. */
  setPreviewOffset(offset: DraggablePosition): void;
  /** Destroy the preview element. */
  removePreviewElement(): void;
  /** The adopted preview element, or `null`. */
  getPreviewElement(): DragPreviewElementHandle | null;
  /** The offset from the preview's top-left to the cursor (see `setPreviewOffset`). */
  getPreviewOffset(): DraggablePosition;
  /**
   * Install preview-level modifiers, applied to the preview's proposed
   * position each frame. Pass `null` to remove them.
   * See `DraggablePreviewSettings.modifiers`.
   */
  setModifiers(modifiers: ReadonlyArray<DraggableRootModifier> | null): void;
  /** Preserve an engine-owned clone long enough to animate it back to the source after release. */
  prepareForDrop(): void;
  destroy(): void;
}
