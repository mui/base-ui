import { clamp } from '@base-ui/utils/clamp';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { contains } from '@base-ui/utils/shadowDom';
import { getFiniteAnimations } from '../../getFiniteAnimations';
import { WindowAnimationFrame } from '../../windowAnimationFrame';
import { WindowTimeout } from '../../windowTimeout';
import { createDragPreviewElement, measurePreviewSource } from './cloneDragPreview';
import type { DragPreviewElementHandle, PreviewAnchor } from './cloneDragPreview';
import { createPreviewContentMirror } from './previewContent';
import type { PreviewContentMirror } from './previewContent';
import type { DraggablePreviewRenderParameters } from '../../../draggable/preview/DraggablePreview';
import type { DraggablePosition } from '../../../draggable/DraggableProvider';
import type { DraggableRootModifier } from '../../../draggable/root/DraggableRoot';
import type { DragModifierKeys } from '../utils';
import { applyDragModifiers } from '../dragModifiers';
import { getSharedSlot } from '../sharedState';
import { setSourceSettling } from '../settlingSources';
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

/** A released preview still running its drop transition onto `source`. */
interface EndingPreview {
  identity: SyntheticPreviewSourceIdentity;
  readonly source: Element;
  retarget(element: HTMLElement): void;
  finish(): void;
}

// Previews still running their drop transition. A new pickup from the same source
// interrupts the previous one. Shared across bundles, like the active drag state.
const endingPreviews = getSharedSlot('dragPreview.ending', () => new Set<EndingPreview>());

/** Whether a transition with a duration covers `translate`. */
function transitionsTranslate(style: CSSStyleDeclaration): boolean {
  const durations = style.transitionDuration.split(',');
  return style.transitionProperty
    .split(',')
    .some(
      (name, index) =>
        (name.trim() === 'all' || name.trim() === 'translate') &&
        Number.parseFloat(durations[index % durations.length]) > 0,
    );
}

function findEndingPreview(source: Element): EndingPreview | undefined {
  for (const entry of endingPreviews) {
    if (entry.source === source) {
      return entry;
    }
  }
  return undefined;
}

/**
 * Finish previews settling onto the source or its descendants before pickup.
 * Their state attributes affect measurement, and a child's preview would be
 * included in a parent clone.
 */
export function finishEndingPreview(source: Element): void {
  for (const entry of endingPreviews) {
    if (contains(source, entry.source)) {
      entry.finish();
    }
  }
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

/** How a custom preview's content is shown, set up at pickup by `attachDragPreview`. */
export interface PreviewContentOptions {
  /** Where the copy of the content goes. Measured at pickup. */
  anchor: PreviewAnchor;
  /**
   * Resolve the preview's offset from its first copy, once it has a size. Called again
   * only after the content declined the preview and rendered something new.
   */
  resolveOffset: (element: HTMLElement) => DraggablePosition;
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
  // Whether the release dropped on a target.
  let dropped = false;
  // Whether the released preview is still running its drop transition.
  let settling = false;

  // The element that follows the pointer: a clone of the source, or a copy of a
  // custom preview's content. It lives beside the source or in the configured
  // `container`. The sensor moves it through `update`.
  let previewElement: DragPreviewElementHandle | null = null;
  // The content of a custom preview and how it is shown. `null` for a clone.
  let content: (PreviewContentOptions & { mirror: PreviewContentMirror }) | null = null;
  // Whether the offset was resolved from the current run of custom content.
  let contentOffsetResolved = false;
  // Publishes the custom preview's content again, for `renderPreview`. Set by the
  // React layer once it has rendered the content for this drag.
  let contentRenderer: ((parameters: DraggablePreviewRenderParameters) => void) | null = null;
  let rendering = false;
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
  // Only the modifiers use it, so it is read lazily in that branch. It does need a
  // rendered element. Browsers resolve computed transforms to matrices only for
  // rendered elements, so a preview a re-render tore out (see `ensureConnected`),
  // or one under `display: none`, would cache `1` for the rest of the drag.
  // `getClientRects` checks this without requiring a size.
  let previewScale: DraggablePosition | null = null;
  // The modifier keys of the event behind the latest position, so preview modifiers
  // see the same key state as root modifiers. Stored here because
  // `positionPreviewElement` also runs from `setPreviewOffset`, which has no event.
  let lastKeys: DragModifierKeys = NO_MODIFIER_KEYS;

  function positionPreviewElement(): void {
    if (!previewElement || !hasPosition) {
      return;
    }
    const currentPreview = previewElement;
    const element = currentPreview.element;
    // A virtualizer can recycle the source's row (and its parent) mid-drag,
    // taking the preview's parent with it. Re-home it before writing the position.
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
    currentPreview.setPosition(proposedX, proposedY);
  }

  function setPreviewOffset(offset: DraggablePosition): void {
    previewOffsetX = offset.x;
    previewOffsetY = offset.y;
    initialProposed = null;
    if (!destroyed) {
      positionPreviewElement();
    }
  }

  function removePreviewElement(): void {
    previewElement?.destroy();
    previewElement = null;
    previewScale = null;
    contentOffsetResolved = false;
    // The offsets described the removed box. Left set, rect modifiers
    // (`restrictToElement`, `restrictToWindowEdges`) would keep clamping against
    // it, for example after a `Draggable.Preview` renders `null`.
    previewOffsetX = 0;
    previewOffsetY = 0;
  }

  /**
   * Swap in a rebuilt preview. The new element is appended after the old one and
   * positioned before the old one is removed, all before the next paint, so the swap
   * never shows.
   */
  function replacePreviewElement(next: DragPreviewElementHandle): void {
    const previous = previewElement;
    previewElement = next;
    previewScale = null;
    positionPreviewElement();
    previous?.destroy();
  }

  /** Show a new copy of the custom content, or remove the preview when it is empty. */
  function showContent(root: HTMLElement | null): void {
    if (destroyed || !content) {
      return;
    }
    if (root === null) {
      removePreviewElement();
      return;
    }
    const next = createDragPreviewElement(sourceElement as HTMLElement, content.anchor, root);
    if (!next) {
      return;
    }
    if (contentOffsetResolved) {
      replacePreviewElement(next);
      return;
    }
    previewElement?.destroy();
    previewElement = next;
    previewScale = null;
    contentOffsetResolved = true;
    // Consumer code. A cancel from it destroys this preview.
    const offset = content.resolveOffset(next.element);
    if (destroyed || previewElement !== next) {
      return;
    }
    setPreviewOffset(offset);
  }

  /**
   * Clone the source again, for `renderPreview`. The clone is built while the source
   * is marked as dragged, so its drag-state attributes are lifted for the duration.
   * Otherwise a `[data-dragging]` rule, such as a dimmed source, would be copied
   * into the clone's style snapshot. Nothing renders in between.
   */
  function refreshClone(): void {
    const current = previewElement;
    const source = sourceElement as HTMLElement;
    if (!current?.isClone || !source.isConnected) {
      return;
    }
    const dragState = [DraggableRootDataAttributes.dragging, DraggableRootDataAttributes.settling]
      .map((name) => [name, source.getAttribute(name)] as const)
      .filter(([, value]) => value !== null);
    for (const [name] of dragState) {
      source.removeAttribute(name);
    }
    let next: DragPreviewElementHandle | null;
    try {
      next = createDragPreviewElement(source, current.anchor);
    } finally {
      for (const [name, value] of dragState) {
        source.setAttribute(name, value!);
      }
    }
    if (next && !destroyed && previewElement === current) {
      replacePreviewElement(next);
    } else {
      next?.destroy();
    }
  }

  function retargetSource(element: HTMLElement): void {
    if ((destroyed && !settling) || element === sourceElement) {
      return;
    }

    sourceElement.removeAttribute(DraggableRootDataAttributes.dragging);
    setSourceSettling(sourceElement, false);
    if (settling) {
      // A fresh drag from the destination can begin before this one settles.
      // It owns that source now, so finish the older preview first.
      findEndingPreview(element)?.finish();
    }

    sourceElement = element;
    sourceElement.setAttribute(DraggableRootDataAttributes.dragging, '');
    if (settling) {
      setSourceSettling(sourceElement, true);
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
    attachContent(options: PreviewContentOptions): void {
      const mirror = createPreviewContentMirror(
        ownerDocument(sourceElement),
        options.anchor.hosts[0],
        {
          onRoot: showContent,
          onRootChange(ownStyle) {
            previewElement?.restoreEngineState(ownStyle);
          },
        },
      );
      content = { ...options, mirror };
    },
    getContentContainer(): HTMLElement | null {
      return content?.mirror.container ?? null;
    },
    syncContent(): void {
      if (!destroyed) {
        content?.mirror.flush();
      }
    },
    freezeContent(): void {
      content?.mirror.stop();
    },
    setContentRenderer(render: (parameters: DraggablePreviewRenderParameters) => void): void {
      contentRenderer = render;
    },
    renderPreview(parameters: DraggablePreviewRenderParameters): void {
      // A render function that calls `renderPreview` would otherwise recurse.
      if (destroyed || rendering) {
        return;
      }
      rendering = true;
      try {
        if (content) {
          contentRenderer?.(parameters);
        } else {
          refreshClone();
        }
      } finally {
        rendering = false;
      }
    },
    markSourceDragging(): void {
      finishEndingPreview(sourceElement);
      // Set only after the preview is built. A `[data-dragging]` rule that changes
      // the source's geometry or hides it would otherwise corrupt the measurement
      // the clone is sized from.
      sourceElement.setAttribute(DraggableRootDataAttributes.dragging, '');
    },
    retargetSource,
    setPreviewOffset,
    removePreviewElement,
    getPreviewElement(): DragPreviewElementHandle | null {
      return previewElement;
    },
    getPreviewOffset(): DraggablePosition {
      return { x: previewOffsetX, y: previewOffsetY };
    },
    prepareForDrop(): void {
      preparedForDrop = true;
    },
    markDropped(): void {
      dropped = true;
    },
    destroy(): void {
      if (destroyed) {
        return;
      }
      // Changes made before the drag ended still reach the copy. Later ones, such as
      // the content unmounting with the drag, do not.
      content?.mirror.stop();
      destroyed = true;
      const endingPreview = previewElement;
      previewElement = null;

      // The engine owns the preview element in both modes, so it can stay mounted
      // until the consumer's drop transition finishes.
      if (preparedForDrop && endingPreview) {
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
            setSourceSettling(sourceElement, false);
            settling = false;
          },
        };
        const cleanup = () => entry.finish();

        findEndingPreview(sourceElement)?.finish();
        settling = true;
        endingPreviews.add(entry);
        setSourceSettling(sourceElement, true);

        // The ending starts in the next frame, before it paints. The release is
        // resolved by then, so `[data-dropped]` applies along with
        // `[data-ending-style]` and no style is computed with one but not the other.
        // State updates that drop handlers schedule later in the release event are
        // committed too, so measuring targets the source's final slot.
        frame.request(() => {
          endingPreview.ensureConnected();
          if (!element.isConnected) {
            cleanup();
            return;
          }
          // Commit the position the drag left the preview at, so an ending transition
          // animates only what changes from here.
          const style = ownerWindow(element).getComputedStyle(element);
          void style.translate;
          element.setAttribute(DraggablePreviewDataAttributes.endingStyle, '');
          if (dropped) {
            element.setAttribute(DraggablePreviewDataAttributes.dropped, '');
          }
          endingPreview.prepareForDrop();
          // Only a `translate` transition animates the move to the source's final
          // position. Without one, the preview ends where it was released, so an
          // ending fade runs there instead of at the source. It ends in place too when
          // the source is gone, or renders no box while the preview does, such as one
          // a `[data-dragging] { display: none }` rule hides: it then measures as a
          // zero rect at the viewport corner.
          if (
            transitionsTranslate(style) &&
            sourceElement.isConnected &&
            (sourceElement.getClientRects().length > 0 || element.getClientRects().length === 0)
          ) {
            const { sourceRect: destination } = measurePreviewSource(sourceElement as HTMLElement);
            endingPreview.setPosition(destination.left, destination.top);
          }

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
   * Adopt the clone to position with the drag, before the first `update`. The engine
   * writes only its `translate`.
   */
  setPreviewElement(preview: DragPreviewElementHandle): void;
  /**
   * Show a custom preview's content. The React layer renders it into
   * `getContentContainer()`, and the copy is built once it has. Until then, the drag
   * has no preview element.
   */
  attachContent(options: PreviewContentOptions): void;
  /** The detached element the React layer renders custom content into, or `null` for a clone. */
  getContentContainer(): HTMLElement | null;
  /** Copy the latest custom content now. The React layer calls it after each commit. */
  syncContent(): void;
  /** Stop copying the custom content, which keeps the preview as it is. */
  freezeContent(): void;
  /** Store how to publish the custom content again, for `renderPreview`. */
  setContentRenderer(render: (parameters: DraggablePreviewRenderParameters) => void): void;
  /**
   * Render the preview again: publish the custom content with `parameters`, or clone
   * the source again. Does nothing once the drag has ended.
   */
  renderPreview(parameters: DraggablePreviewRenderParameters): void;
  /**
   * Mark the source as being dragged. Called once the preview exists, so a
   * `[data-dragging]` rule can't affect the geometry the preview was measured from.
   */
  markSourceDragging(): void;
  /** Follow the drag source to a fresh node when a virtualizer remounts it mid-drag. */
  retargetSource(element: HTMLElement): void;
  /**
   * Set the offset from the preview's top-left to the cursor. Called at pickup, or
   * once the first copy of custom content has a size.
   */
  setPreviewOffset(offset: DraggablePosition): void;
  /** Destroy the preview element. */
  removePreviewElement(): void;
  /** The current preview element, or `null`. */
  getPreviewElement(): DragPreviewElementHandle | null;
  /** The offset from the preview's top-left to the cursor (see `setPreviewOffset`). */
  getPreviewOffset(): DraggablePosition;
  /** Keep the preview long enough to animate it back to the source after release. */
  prepareForDrop(): void;
  /** Mark the ending preview as dropped on a target, for `[data-dropped]` styles. */
  markDropped(): void;
  destroy(): void;
}
