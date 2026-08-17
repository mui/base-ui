import { ownerWindow } from '@base-ui/utils/owner';
import { AnimationFrame } from '@base-ui/utils/useAnimationFrame';
import type { DragPreviewElementHandle } from './cloneDragPreview';
import type { DragModifier, DragModifierKeys, DragMode, DragPosition } from '../../../types/drag';
import { applyDragModifiers } from '../dragModifiers';
import { getSharedSlot } from '../sharedState';
import { getElementScale, NO_MODIFIER_KEYS } from '../utils';

const ZERO_OFFSET: DragPosition = { x: 0, y: 0 };
/** No ancestor transform: what `getElementScale` reports for an unscaled element. */
const DEFAULT_SCALE: DragPosition = { x: 1, y: 1 };

/**
 * Set on the drag source for the whole drag, so the source can be dimmed in one
 * CSS rule — `[data-dragging] { opacity: 0.4 }`. The default preview is a clone
 * anchored to the grab point, so it starts out exactly on top of the source;
 * without dimming the two read as one element. The engine deliberately does not
 * hide the source itself — that is an opinion the CSS should own.
 */
const DRAGGING_ATTR = 'data-dragging';

/**
 * Set to the drag's input modality (`'pointer'` or `'keyboard'`) on both the source
 * and the preview, so CSS can tell the two apart. The main use is easing the
 * preview's `translate` for keyboard drags — which jump between discrete positions —
 * while leaving pointer drags to track the cursor without lag.
 */
const DRAG_MODE_ATTR = 'data-drag-mode';
const ENDING_STYLE_ATTR = 'data-ending-style';

// A new pickup from the same source interrupts its previous drop transition.
// Shared across bundles for the same reason the active drag engine state is.
const endingPreviews = getSharedSlot(
  'dragPreview.endingSources',
  () => new WeakMap<Element, () => void>(),
);

export interface SyntheticPreviewSourceIdentity {
  kind: symbol;
  previewKey: string | number | undefined;
  /** The static declaration, not the value returned by `getPayload`. */
  payload: unknown;
}

interface EndingPreviewRegistration {
  identity: SyntheticPreviewSourceIdentity;
  sourceElement: Element;
  retarget(element: HTMLElement): void;
}

const endingPreviewRegistrations = getSharedSlot(
  'dragPreview.endingRegistrations',
  () => new Set<EndingPreviewRegistration>(),
);

/**
 * Follow a settling clone to a draggable that remounted as part of the drop commit.
 * A cross-container move creates a new React subtree, so the active-drag retargeting
 * path cannot connect the old and new ref callbacks itself.
 */
export function retargetEndingPreviewSource(
  element: HTMLElement,
  identity: SyntheticPreviewSourceIdentity,
): void {
  for (const registration of endingPreviewRegistrations) {
    if (registration.sourceElement.isConnected || registration.identity.kind !== identity.kind) {
      continue;
    }

    const sameDeclaredPayload =
      identity.payload !== undefined && Object.is(registration.identity.payload, identity.payload);
    const samePreviewKey =
      identity.previewKey !== undefined &&
      Object.is(registration.identity.previewKey, identity.previewKey);
    if (sameDeclaredPayload || samePreviewKey) {
      registration.retarget(element);
      return;
    }
  }
}

export function createSyntheticPreview(
  initialSourceElement: Element,
  mode: DragMode,
  sourceIdentity?: SyntheticPreviewSourceIdentity,
): SyntheticPreviewHandle {
  // Re-pointed when a virtualizer remounts the dragged item to a fresh node, so the
  // drag-state attribute follows the live element the way `isDragging` does.
  let sourceElement: Element = initialSourceElement;
  let destroyed = false;
  let preparedForDrop = false;
  let endingCleanup: (() => void) | null = null;

  // The element that follows the pointer: an opted-in clone of the source, or the host a
  // `Draggable.Preview` renders into. Either way it lives in the source's own DOM
  // position, and both sensors drive `update`, so it works for pointer and keyboard
  // drags alike.
  let previewElement: DragPreviewElementHandle | null = null;
  let previewOffsetX = 0;
  let previewOffsetY = 0;
  let lastX = 0;
  let lastY = 0;
  let hasPosition = false;
  // The preview is tagged with `data-drag-mode` only after it has been positioned
  // once, so easing a keyboard drag's `translate` never animates the jump from the
  // preview's off-screen parking spot to the pickup point. Reset when a new preview
  // element is adopted.
  let previewModeApplied = false;
  // Opt-in preview-level `modifiers`, compiled to a non-empty list, or
  // `null` for none. Constrains where the preview is drawn without touching the
  // drag itself (the root's `modifiers` does that).
  let modifiers: ReadonlyArray<DragModifier> | null = null;
  // The preview's proposed top-left on the first frame positioned with the
  // current element and offset — the reference a preview-level axis lock or grid
  // snaps against. Reset whenever the element or offset changes (a preview
  // adopted mid-drag, a callback offset resolving late), so the anchor is never
  // a proposal computed from a stale offset.
  let initialProposed: DragPosition | null = null;
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
  let previewScale: DragPosition = DEFAULT_SCALE;
  let previewScaleMeasured = false;
  // The last coordinates written to the current preview. Axis locks and grid
  // snaps often resolve several pointer samples to the same point; avoid
  // invalidating style for an identical `translate`.
  let positionedElement: HTMLElement | null = null;
  let positionedX = 0;
  let positionedY = 0;
  // The modifier keys of the event behind the latest position, so preview modifiers see
  // the same key state root modifiers do. Held here rather than passed down each frame
  // because `positionPreviewElement` is also called from `setPreviewElement`, which has
  // no event of its own.
  let lastKeys: DragModifierKeys = NO_MODIFIER_KEYS;

  function positionPreviewElement(): void {
    if (previewElement) {
      // A virtualizer can recycle the source's row (and its parent) mid-drag,
      // taking the clone's host with it. Re-home it before writing the position.
      previewElement.ensureConnected();
      let proposedX = lastX - previewOffsetX;
      let proposedY = lastY - previewOffsetY;
      initialProposed ??= { x: proposedX, y: proposedY };
      if (modifiers) {
        const { element } = previewElement;
        if (!previewScaleMeasured && element.getClientRects().length > 0) {
          previewScale = getElementScale(element);
          previewScaleMeasured = true;
        }
        const constrained = applyDragModifiers(
          modifiers,
          { x: proposedX, y: proposedY },
          {
            initialPoint: initialProposed,
            input: { x: lastX, y: lastY },
            sourceElement: sourceElement as HTMLElement,
            sourceRect: previewElement.sourceRect,
            // The preview is what these modifiers move, so a step in "its own units" is
            // measured against the preview rather than the source.
            scale: previewScale,
            // `point` is the top-left itself here, so the offset is zero.
            previewOffset: ZERO_OFFSET,
            mode,
            keys: lastKeys,
            ownerWindow: ownerWindow(element),
            getPreviewRect: () => element.getBoundingClientRect(),
          },
        );
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
      const element = previewElement.element;
      if (element !== positionedElement || proposedX !== positionedX || proposedY !== positionedY) {
        element.style.translate = `${proposedX}px ${proposedY}px`;
        positionedElement = element;
        positionedX = proposedX;
        positionedY = proposedY;
      }
      if (!previewModeApplied) {
        previewModeApplied = true;
        // Wait a frame so this first position is committed before the transition
        // turns on — otherwise a keyboard drag would ease in from off-screen.
        const { element } = previewElement;
        AnimationFrame.request(() => {
          if (!destroyed && previewElement?.element === element) {
            element.setAttribute(DRAG_MODE_ATTR, mode);
          }
        }, ownerWindow(element));
      }
    }
  }

  function retargetSource(element: HTMLElement): void {
    if ((destroyed && endingCleanup === null) || element === sourceElement) {
      return;
    }

    const previousSource = sourceElement;
    previousSource.removeAttribute(DRAGGING_ATTR);
    previousSource.removeAttribute(DRAG_MODE_ATTR);
    previousSource.removeAttribute(ENDING_STYLE_ATTR);
    if (endingCleanup && endingPreviews.get(previousSource) === endingCleanup) {
      endingPreviews.delete(previousSource);
    }

    sourceElement = element;
    if (endingCleanup) {
      // A fresh drag from the destination can begin before this one settles.
      // It owns that source now, so finish the older preview first.
      const interrupted = endingPreviews.get(sourceElement);
      if (interrupted && interrupted !== endingCleanup) {
        interrupted();
      }
      endingPreviews.set(sourceElement, endingCleanup);
    }
    sourceElement.setAttribute(DRAGGING_ATTR, '');
    sourceElement.setAttribute(DRAG_MODE_ATTR, mode);
    if (endingCleanup) {
      sourceElement.setAttribute(ENDING_STYLE_ATTR, '');
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
    setPreviewElement(preview: DragPreviewElementHandle | null, offset?: DragPosition): void {
      if (destroyed) {
        preview?.destroy();
        return;
      }
      previewElement?.destroy();
      previewElement = preview;
      positionedElement = null;
      previewScale = DEFAULT_SCALE;
      previewScaleMeasured = false;
      previewModeApplied = false;
      previewOffsetX = offset?.x ?? 0;
      previewOffsetY = offset?.y ?? 0;
      initialProposed = null;
      if (preview && hasPosition) {
        positionPreviewElement();
      }
    },
    markSourceDragging(): void {
      endingPreviews.get(sourceElement)?.();
      // Set only once the preview is built: a `[data-dragging]` rule that changes
      // the source's geometry (or hides it outright) would otherwise corrupt the
      // measurement the clone is sized from.
      sourceElement.setAttribute(DRAGGING_ATTR, '');
      sourceElement.setAttribute(DRAG_MODE_ATTR, mode);
    },
    retargetSource,
    setPreviewOffset(offset: DragPosition): void {
      // A `Draggable.Preview` whose offset is a callback can only be resolved once React
      // has rendered its content and the element has a size, which happens after
      // the engine placed it. Re-anchor it then, without waiting for a pointer move
      // (a keyboard drag has no frame loop to self-heal).
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
      positionedElement = null;
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
    getPreviewOffset(): DragPosition {
      return { x: previewOffsetX, y: previewOffsetY };
    },
    setModifiers(next: ReadonlyArray<DragModifier> | null): void {
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
        const frame = new AnimationFrame(ownerWindow(element));
        let registration: EndingPreviewRegistration | null = null;

        const cleanup = () => {
          frame.cancel();
          endingPreview.destroy();
          if (registration) {
            endingPreviewRegistrations.delete(registration);
          }
          if (endingPreviews.get(sourceElement) === cleanup) {
            endingPreviews.delete(sourceElement);
            sourceElement.removeAttribute(DRAGGING_ATTR);
            sourceElement.removeAttribute(DRAG_MODE_ATTR);
            sourceElement.removeAttribute(ENDING_STYLE_ATTR);
          }
          endingCleanup = null;
        };

        endingCleanup = cleanup;
        endingPreviews.get(sourceElement)?.();
        endingPreviews.set(sourceElement, cleanup);
        sourceElement.setAttribute(ENDING_STYLE_ATTR, '');
        if (sourceIdentity) {
          registration = {
            identity: sourceIdentity,
            sourceElement,
            retarget(elementToAdopt) {
              retargetSource(elementToAdopt);
              registration!.sourceElement = elementToAdopt;
            },
          };
          endingPreviewRegistrations.add(registration);
        }
        element.setAttribute(ENDING_STYLE_ATTR, '');

        // `onDrop` updates scheduled later in the release event commit before
        // this frame. Measure then, so the destination is the source's final
        // slot rather than the slot it occupied when the pointer came up.
        frame.request(() => {
          endingPreview.ensureConnected();
          if (!sourceElement.isConnected || !element.isConnected) {
            cleanup();
            return;
          }

          const destination = sourceElement.getBoundingClientRect();
          element.style.translate = `${destination.left}px ${destination.top}px`;

          const animations = globalThis.BASE_UI_ANIMATIONS_DISABLED
            ? []
            : (element.getAnimations?.() ?? []).filter(
                (animation) => animation.effect?.getTiming().iterations !== Infinity,
              );
          if (animations.length === 0) {
            cleanup();
            return;
          }
          Promise.allSettled(animations.map((animation) => animation.finished)).then(cleanup);
        });
        return;
      }

      endingPreview?.destroy();
      sourceElement.removeAttribute(DRAGGING_ATTR);
      sourceElement.removeAttribute(DRAG_MODE_ATTR);
    },
  };
}

export interface SyntheticPreviewHandle {
  /** `keys` are the modifier keys of the event behind this position, for preview modifiers. */
  update(clientX: number, clientY: number, keys?: DragModifierKeys): void;
  /**
   * Adopt the preview element to position with the drag, or `null` to release it.
   * The engine writes only its `translate`.
   */
  setPreviewElement(preview: DragPreviewElementHandle | null, offset?: DragPosition): void;
  /**
   * Mark the source as being dragged. Called once the preview exists, so a
   * `[data-dragging]` rule can't affect the geometry the preview was measured from.
   */
  markSourceDragging(): void;
  /** Follow the drag source to a fresh node when a virtualizer remounts it mid-drag. */
  retargetSource(element: HTMLElement): void;
  /** Re-anchor the preview once React has rendered content into it and it has a size. */
  setPreviewOffset(offset: DragPosition): void;
  /** Destroy the preview element. */
  removePreviewElement(): void;
  /** The adopted preview element, or `null`. */
  getPreviewElement(): DragPreviewElementHandle | null;
  /** The offset from the preview's top-left to the cursor (see `setPreviewOffset`). */
  getPreviewOffset(): DragPosition;
  /**
   * Install preview-level modifiers, applied to the preview's proposed
   * position each frame. Pass `null` to remove them.
   * See `DragPreviewSettings.modifiers`.
   */
  setModifiers(modifiers: ReadonlyArray<DragModifier> | null): void;
  /** Preserve an engine-owned clone long enough to animate it back to the source after release. */
  prepareForDrop(): void;
  destroy(): void;
}
